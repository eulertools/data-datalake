#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EthRawDataStack } from '../lib/eth-raw-data-stack';

const app = new cdk.App();
new EthRawDataStack(app, 'EthRawDataStack', {

});
