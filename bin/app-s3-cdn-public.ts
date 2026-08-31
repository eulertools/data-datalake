import * as cdk from 'aws-cdk-lib';
import { AppS3CdnPublicStack } from '../lib/app-s3-cdn-public-stack';

const hostedZone = process.env.CDK_DEFAULT_ACCOUNT == process.env.CDK_DEV_ACCOUNT ? 'dev.euler.tools' : 'prod.euler.tools'

const app = new cdk.App();

new AppS3CdnPublicStack(app, 'app-cdn-public-stack', {
  hostedZone,
  description: 'App stack including s3 and public cdn',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
