import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_kinesis as kinesis } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { AppBlockchainFirehoseInfraStack } from './construct/app-blockchain-firehose-stack';

interface blocksProps extends StackProps {
  chainId: string;
}

export class AppBlockchainS3BlocksStack extends Stack {
  constructor(scope: Construct, id: string, props?: blocksProps) {
    super(scope, id, props);

    const { chainId } = props!;

    const blocksBucket = s3.Bucket.fromBucketName(this, `${chainId}-blocks-bucket`, `${chainId}-blockchain-block`);

    const blocksStream = kinesis.Stream.fromStreamAttributes(this, `${chainId}-blocks-stream`, {
     streamArn: `arn:aws:kinesis:us-east-1:CDK_DEV_ACCOUNT:stream/${chainId}-blocks`
    });

    const lambdaEvent = new lambda.Function(this, `${chainId}-lambda-blocks-events`, {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('./src'),
      timeout: Duration.seconds(60),
      memorySize: 512,
      handler: 'app-blockchain-s3-blocks.handler',
      functionName: `${chainId}-blockchain-s3-blocks`,
      environment: {
        CHAIN_ID: chainId
      }
    });

    new AppBlockchainFirehoseInfraStack(this, `${chainId}-app-blockchain-firehose-infra-stack`, {
      bucket: blocksBucket,
      stream: blocksStream,
      lambda: lambdaEvent,
      prefix: 'kinesis-stream-data-blocks/'
    });
  }
}
