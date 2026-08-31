#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { CatalogFunctionsDatabaseStack } from "../lib/catalog-functions-stack";

const app = new App();

new CatalogFunctionsDatabaseStack(app, 'CatalogFunctionsDatabaseStack', {
  description: 'App stack for catalog smart contract functions',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});