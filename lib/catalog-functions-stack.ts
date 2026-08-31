import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class CatalogFunctionsDatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'catalogFunctionsDynamoDB', {
      partitionKey: { name: 'signature', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'header', type: dynamodb.AttributeType.STRING }
    });

    new CfnOutput(this, 'catalogFunctionTableOutput', {
      description: 'Table name of Smart Contract Functions',
      value: table.tableName,
      exportName: 'catalog-functions-tablename'
    })
  }
}
