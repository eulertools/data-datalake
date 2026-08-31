import * as cdk from 'aws-cdk-lib';
import { AppRdsInstancesStack } from '../lib/blockchain-databases-stack';
import { AppInitDBInstancesStack } from '../lib/init_blockchain-databases-stack';

const app = new cdk.App();

new AppInitDBInstancesStack(app, 'AppInitDBInstancesStack', {
  description: "Inserts Ethereum Data into postgres",
  tags: { network: "bsc", ussage: "data-processors-worker" },
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppRdsInstancesStack(app, 'BSCAppRdsInstancesStack', {
  chainId: "bsc",
  description: "Inserts Ethereum Data into postgres",
  tags: { network: "bsc", ussage: "data-processors-worker" },
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new AppRdsInstancesStack(app, 'ETHAppRdsInstancesStack', {
  chainId: "eth",
  description: "Inserts Ethereum Data into postgres",
  tags: { network: "eth", ussage: "data-processors-worker" },
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});