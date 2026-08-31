#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppEthscanS3WalletsStack } from '../lib/app-ethscan-s3-wallets-stack';

const app = new cdk.App();
new AppEthscanS3WalletsStack(app, 'AppEthscanS3WalletsStack', {
  description: 'App stack for the ethscan wallet',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});