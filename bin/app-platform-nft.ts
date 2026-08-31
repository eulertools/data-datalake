#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { PlatformNFTDatabaseStack } from "../lib/platform-nft-stack";

const app = new App();

const hostedZone =
  process.env.CDK_DEFAULT_ACCOUNT == process.env.CDK_DEV_ACCOUNT
    ? "dev.euler.tools"
    : "prod.euler.tools";

new PlatformNFTDatabaseStack(app, 'PlatformNFTDatabaseStack', {
  description: 'App stack for platform of nft',
  hostedZone,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});