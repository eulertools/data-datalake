import * as cdk from 'aws-cdk-lib';
import { AppBlockchainS3BucketsStack } from '../lib/app-blockchain-s3-buckets-stack';
import {AppBlockchainS3BlocksStack} from "../lib/app-blockchain-s3-blocks-stack";
import {AppBlockchainS3LogsStack} from "../lib/app-blockchain-s3-logs-stack";
import {AppBlockchainS3TransactionsStack} from "../lib/app-blockchain-s3-transactions-stack";

const app = new cdk.App();

new AppBlockchainS3BucketsStack(app, 'ETHAppBlockchainS3BucketsStack', {
  chainId: 'eth',
  description: 'App stack for the eth blockchain s3 buckets',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppBlockchainS3BlocksStack(app, 'ETHAppBlockchainS3BlocksStack', {
  chainId: 'eth',
  description: 'App stack for the blocks',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppBlockchainS3LogsStack(app, 'ETHAppBlockchainS3LogsStack', {
  chainId: 'eth',
  description: 'App stack for the logs',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppBlockchainS3TransactionsStack(app, 'ETHAppBlockchainS3TransactionsStack', {
  chainId: 'eth',
  description: 'App stack for the transactions',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppBlockchainS3BucketsStack(app, 'BSCAppBlockchainS3BucketsStack', {
  chainId: 'bsc',
  description: 'App stack for the bsc blockchain s3 buckets',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppBlockchainS3BlocksStack(app, 'BSCAppBlockchainS3BlocksStack', {
  chainId: 'bsc',
  description: 'App stack for the blocks',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});


new AppBlockchainS3LogsStack(app, 'BSCAppBlockchainS3LogsStack', {
  chainId: 'bsc',
  description: 'App stack for the logs',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppBlockchainS3TransactionsStack(app, 'BSCAppBlockchainS3TransactionsStack', {
  chainId: 'bsc',
  description: 'App stack for the transactions',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});


