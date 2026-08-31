import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DynamoStreamConstruct } from './construct/dynamodb-stream-construct' 
import { DynamoDBStreamOpenSearchConstruct } from './construct/dynamodb-stream-opensearch-construct' 

export interface AppStackProps extends StackProps {
  hostedZone: string;
}
export class PlatformNFTDatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    const domain:opensearch.IDomain = opensearch.Domain.fromDomainEndpoint(this, 'OSDomain', `https://catalogs.${hostedZone}`);

    const apiCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "opensearchMasterUser",
      "opensearchMasterUser"
    );

    const OSUser = apiCreds.secretValueFromJson("username").toString();
    const OSPassword = apiCreds.secretValueFromJson("password").toString();

    const tableCollectionNFT = new DynamoStreamConstruct(this, 'collection-nft-dynamo-construct', {
      prefix: 'collection-nft',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    })

    tableCollectionNFT.table.addGlobalSecondaryIndex({
      indexName: 'platformNFTDynamoDB_blockchainIndex',
      partitionKey: {name: 'blockchain', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'address', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new DynamoDBStreamOpenSearchConstruct(this, 'collection-nft-stream-opensearch-construct', {
      prefix: 'collection-nft',
      stream: tableCollectionNFT.stream,
      domain,
      index: 'platform_nft_collection_v1',
      pk: 'identifier',
      OSUser,
      OSPassword
    })

    const tableNFT = new DynamoStreamConstruct(this, 'nft-dynamo-construct', {
      prefix: 'nft',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    })

    tableNFT.table.addGlobalSecondaryIndex({
      indexName: 'platformNFTDynamoDB_collectionIndex',
      partitionKey: {name: 'collection', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'token_id', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    tableNFT.table.addGlobalSecondaryIndex({
      indexName: 'platformNFTDynamoDB_identifierIndex',
      partitionKey: {name: 'identifier', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new DynamoDBStreamOpenSearchConstruct(this, 'nft-stream-opensearch-construct', {
      prefix: 'nft',
      stream: tableNFT.stream,
      domain,
      index: 'platform_nft_v1',
      pk: 'identifier',
      OSUser,
      OSPassword
    })

    new DynamoStreamConstruct(this, 'request-nft-dynamo-construct', {
      prefix: 'request-nft',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    });
  }
}
