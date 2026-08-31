import * as path from 'path';
import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib'; 'aws-cdk-lib/aws-s3';
import { aws_glue as glue } from 'aws-cdk-lib'; 'aws-cdk-lib/aws-glue';
import { aws_iam as iam  } from 'aws-cdk-lib'; 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets'; 
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

const createParquetJob = (stack:Stack, role:iam.Role, params:any) => {

  new glue.CfnJob(stack, params.id, {
    name: params.name,
    description: 'Convert the csv files in S3 to parquet',
    role: role.roleArn,
    executionProperty: {
      maxConcurrentRuns: 1,
    },
    command: {
      name: 'glueetl',
      pythonVersion: '3',
      scriptLocation: params.script
    },
    defaultArguments: {
      '--TempDir': params.basePath + '/output/temp/',
      '--job-bookmark-option': 'job-bookmark-enable',
      '--job-language': 'python',
      '--spark-event-logs-path': params.basePath  + '/output/logs/',
      '--enable-metrics': '',
      '--enable-continuous-cloudwatch-log': 'true',
      '--input_database': params.inputDatabase,
      '--input_table': params.inputTable,
      '--output_bucket_name': params.outputPath,
      '--output_database': params.outputDatabase,
      '--output_table': params.outputTable,
      '--output_format': 'glueparquet',
      '--output_compression': 'snappy',
      '--mapping': Buffer.from(JSON.stringify(params.mapping),'ascii').toString('base64'),
      '--partition_keys': Buffer.from(JSON.stringify(params.partitions),'ascii').toString('base64'),
    },
    maxRetries: 0,
    timeout: 240,
    numberOfWorkers: 10,
    glueVersion: '3.0',
    workerType: 'G.1X',
  });
}

export class AppEthscanS3WalletsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'evm-wallets-bucket', {
      bucketName: 'evm-wallets',
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const table = new dynamodb.Table(this, 'evmWalletControlDynamoDB', {
      partitionKey: { name: 'identifier', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'blockchain', type: dynamodb.AttributeType.STRING }
    });

    new CfnOutput(this, 'evmWalletControlTableOutput', {
      description: 'Table name of EVM wallet control',
      value: table.tableName,
      exportName: 'evm-wallet-control-tablename'
    })
  }
}
