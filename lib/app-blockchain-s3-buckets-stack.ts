import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';

interface bucketProps extends StackProps {
  chainId: string;
}

export class AppBlockchainS3BucketsStack extends Stack {
  constructor(scope: Construct, id: string, props?: bucketProps) {
    super(scope, id, props);

    const { chainId } = props!;

    const blocksBucket = new s3.Bucket(this, `${chainId}-blocks-bucket`, {
      bucketName: `${chainId}-blockchain-block`,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const logsBucket = new s3.Bucket(this, `${chainId}-logs-bucket`, {
      bucketName: `${chainId}-blockchain-log`,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const transactionsBucket = new s3.Bucket(this, `${chainId}-transactions-bucket`, {
      bucketName: `${chainId}-blockchain-transaction`,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY
    });
  }
}
