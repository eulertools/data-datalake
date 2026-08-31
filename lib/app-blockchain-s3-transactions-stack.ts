import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_kinesis as kinesis } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { AppBlockchainFirehoseInfraStack } from './construct/app-blockchain-firehose-stack';

interface transactionProps extends StackProps {
  chainId: string;
}

export class AppBlockchainS3TransactionsStack extends Stack {
  constructor(scope: Construct, id: string, props?: transactionProps) {
    super(scope, id, props);

    const { chainId } = props!;

    const transactionsBucket = s3.Bucket.fromBucketName(this, `${chainId}-transactions-bucket`, `${chainId}-blockchain-transaction`);

    const transactionsStream = kinesis.Stream.fromStreamAttributes(this, `${chainId}-transactions-stream`, {
      streamArn: `arn:aws:kinesis:us-east-1:CDK_DEV_ACCOUNT:stream/${chainId}-transactions`
    });
 
    const lambdaEvent = new lambda.Function(this, `${chainId}-lambda-transactions-events`, {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('./src'),
      timeout: Duration.seconds(60),
      memorySize: 512,
      handler: 'app-blockchain-s3-transactions.handler',
      functionName: `${chainId}-blockchain-s3-transactions`,
      environment: {
        CHAIN_ID: chainId
      }
    });
 
    new AppBlockchainFirehoseInfraStack(this, `${chainId}-app-blockchain-firehose-infra-stack`, {
      bucket: transactionsBucket,
      stream: transactionsStream,
      lambda: lambdaEvent,
      prefix: 'kinesis-stream-data-transactions/'
    });
  }
}
