import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as S3Deployment  from "aws-cdk-lib/aws-s3-deployment";
import * as logs from 'aws-cdk-lib/aws-logs'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from "path";
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface InitDBInstancesProps extends StackProps {}

export class AppInitDBInstancesStack extends Stack {
  constructor(scope: App, id: string, props?: InitDBInstancesProps) {
    super(scope, id, props);

    const role = new iam.Role(this, 'initDBLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const scriptsBucket = new s3.Bucket(this, 'init-db-scripts', {
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY
    });

    new S3Deployment.BucketDeployment(this, "Deployment", {
      sources: [S3Deployment.Source.asset(path.join(__dirname, `/assets/init-db-scripts`))],
      destinationBucket: scriptsBucket,
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));

    new NodejsFunction(this, `initBlockchainDBHandler`, {
      description: 'Execute script to init DB',
      memorySize: 512,
      role: role,
      logRetention: logs.RetentionDays.ONE_DAY,
      timeout: cdk.Duration.minutes(5),
      handler: 'handler',
      functionName: 'init-blockchain-db',
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../src/init-blockchain-databases/index.ts`),
      allowPublicSubnet: true,
      bundling: {
        minify: true,
        externalModules: ['electron'],
        nodeModules: ["pg"]
      },
      environment: {
        BUCKET_NAME: scriptsBucket.bucketName,
      }
    });

    scriptsBucket.grantRead(role);

    new CfnOutput(this, `InitDBBlockchainARN`, {
      value: role.roleArn,
      exportName: 'init-blockchain-db-role-arm',
    });
  }
}