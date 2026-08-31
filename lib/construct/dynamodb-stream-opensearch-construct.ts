import { Construct } from 'constructs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam'


export interface ConstructProps {
  prefix: string;
  stream: kinesis.IStream;
  domain: opensearch.IDomain;
  index: string;
  pk: string;
  OSUser: string;
  OSPassword: string;
}

export class DynamoDBStreamOpenSearchConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ConstructProps) {
    super(scope, id);

    const {stream, prefix, domain, index, pk, OSUser, OSPassword } = props!

    const lambdaEvent = new NodejsFunction(this, `${prefix}-lambda-stream-opensearch-events`, {
      description: 'Kinesis streaming from Dynamo to OpenSearch',
      memorySize: 512,
      logRetention: RetentionDays.ONE_DAY,
      timeout: Duration.minutes(1),
      handler: 'handler',
      functionName: `${prefix}-lambda-stream-opensearch-events`,
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../../src/kinesis-elasticsearch-syncer/index.ts`),
      allowPublicSubnet: true,
      bundling: {
        minify: true,
        externalModules: ['electron'],
      },
      environment: { 
        ES_DOMAIN: `${domain.domainEndpoint}`,
        ES_INDEX: index,
        PK: pk,
        OS_USER: OSUser,
        OS_PASSWORD: OSPassword,
      }
    });

    stream.grantRead(lambdaEvent);
    const eventSource = new lambdaEventSources.KinesisEventSource(stream, {
      batchSize: 200,
      parallelizationFactor: 1,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      enabled: true,
    });

    lambdaEvent.addEventSource(eventSource);

    domain.grantReadWrite(lambdaEvent);

    lambdaEvent.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["es:*"],
        resources: ["*"],
      })
    );
  }
}
