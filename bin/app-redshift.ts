import * as cdk from "aws-cdk-lib";
import { AppRedShiftStack } from "../lib/app-redshit-stack";

const app = new cdk.App();

new AppRedShiftStack(app, "app-red-shift-stack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
