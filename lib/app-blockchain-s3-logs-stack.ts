import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_kinesis as kinesis } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { AppBlockchainFirehoseInfraStack } from './construct/app-blockchain-firehose-stack';

interface logsProps extends StackProps {
  chainId: string;
}

export class AppBlockchainS3LogsStack extends Stack {
  constructor(scope: Construct, id: string, props?: logsProps) {
    super(scope, id, props);

    const { chainId } = props!;

    const logsBucket = s3.Bucket.fromBucketName(this, `${chainId}-logs-bucket`, `${chainId}-blockchain-log`);

    const logsStream = kinesis.Stream.fromStreamAttributes(this, `${chainId}-logs-stream`, {
     streamArn: `arn:aws:kinesis:us-east-1:CDK_DEV_ACCOUNT:stream/${chainId}-logs`
    });

    const lambdaEvent = new lambda.Function(this, `${chainId}-lambda-logs-events`, {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('./src'),
      timeout: Duration.seconds(60),
      memorySize: 512,
      handler: 'app-blockchain-s3-logs.handler',
      functionName: `${chainId}-blockchain-s3-logs`,
      environment: {
        CHAIN_ID: chainId
      }
    });

    new AppBlockchainFirehoseInfraStack(this, `${chainId}-app-blockchain-firehose-infra-stack`, {
      bucket: logsBucket,
      stream: logsStream,
      lambda: lambdaEvent,
      prefix: 'kinesis-stream-data-logs/'
    });
  }
}
