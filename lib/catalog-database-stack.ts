import { App, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class CatalogDatabaseStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "catalog", {
      partitionKey: {
        name: "identifier",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "kind",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "catalog",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    new CfnOutput(this, "dynamodbTable", {
      value: table.tableArn,
      description: "Catalog DynamodbTable",
      exportName: "dynamodb-catalog-table",
    });
  }
}
