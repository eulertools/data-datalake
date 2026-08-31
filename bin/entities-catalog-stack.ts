#!/usr/bin/env node
import "source-map-support/register";
import { App, Fn } from "aws-cdk-lib";
import { CatalogDataRepositoryStack } from "../lib/catalog-data-repository-stack";
import { CatalogDatabaseStack } from "../lib/catalog-database-stack";
import { ECRStack } from "../lib/ecr-stack";
import { EntitiesCatalogStack } from "../lib/entities-catalog-stack";

const app = new App();

const hostedZone =
  process.env.CDK_DEFAULT_ACCOUNT == process.env.CDK_DEV_ACCOUNT
    ? "dev.euler.tools"
    : "prod.euler.tools";

new CatalogDatabaseStack(app, "catalog-database", {
  description:
    "Entities Catalog includes dynamodb, elasticsearch, streams and lambdas",
  tags: {
    network: "agnostic",
    applicationName: "entities-app-entities-catalog",
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new CatalogDataRepositoryStack(app, "catalog-data-warehouse", {
  description:
    "Entities Catalog includes dynamodb, elasticsearch, streams and lambdas",
  tags: {
    network: "agnostic",
    applicationName: "entities-app-entities-catalog",
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new ECRStack(app, "catalog-ecr-repository", {
  description:
    "Entities Catalog includes dynamodb, elasticsearch, streams and lambdas",
  tags: {
    network: "agnostic",
    applicationName: "entities-app-entities-catalog",
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new EntitiesCatalogStack(app, "entities-catalog-stack", {
  hostedZone: hostedZone,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
