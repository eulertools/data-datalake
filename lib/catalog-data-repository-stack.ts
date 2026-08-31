import {
  App,
  aws_certificatemanager as cert,
  aws_opensearchservice as opensearch,
  aws_route53 as route53,
  CfnResource,
  Duration, Fn,
  Stack,
  StackProps
} from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";

export class CatalogDataRepositoryStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const commonVpc = ec2.Vpc.fromLookup(this, "legacy-vpc", { vpcName: 'legacy' });

    new CfnResource(this, "es-service-linked-role", {
      type: "AWS::IAM::ServiceLinkedRole",
      properties: {
        AWSServiceName: "es.amazonaws.com",
        Description: "Role for ES to access resources in my VPC",
      },
    });

    const certificateArn = Fn.importValue('certificate-public-catalog')
    const certificate = cert.Certificate.fromCertificateArn(
      this,
      "CertificateImported",
      certificateArn
    );

    const hostedZone = Fn.importValue('euler-private-zone')
    const hostedZoneId = route53.HostedZone.fromLookup(this, "HostedZone", {
      privateZone: true,
      domainName: hostedZone.toString()
    });

    const appsSecGroupId = Fn.importValue('sec-group-id-common-applications')
    const appSecGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "ResourcesSG",
      appsSecGroupId.toString()
    );

    const servicesSecGroupId = Fn.importValue('sec-group-id-common-services')
    const servicesSecGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "ServicesSG",
      servicesSecGroupId.toString()
    );

    const apiCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "opensearchMasterUser",
      "opensearchMasterUser"
    );

    const OSUser = apiCreds.secretValueFromJson("username").toString();
    const OSPassword = apiCreds.secretValueFromJson("password").toString();

    const OSDomain = new opensearch.Domain(this, "OSDomain", {
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      fineGrainedAccessControl: {
        masterUserName: OSUser,
        masterUserPassword: apiCreds.secretValueFromJson("password"),
      },
      capacity: {
        masterNodeInstanceType: "r6g.medium.search",
        dataNodeInstanceType: "r6g.medium.search",
        masterNodes: 1,
        dataNodes: 3,
      },
      ebs: {
        volumeSize: 20,
      },
      zoneAwareness: {
        availabilityZoneCount: 2,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      domainName: "catalog",
      customEndpoint: {
        domainName: `entities.${hostedZone}`,
        certificate: certificate,
        hostedZone: hostedZoneId,
      },
      vpc: commonVpc,
      vpcSubnets: [commonVpc.selectSubnets({ subnetType: SubnetType.PUBLIC, onePerAz: true })],
      securityGroups: [servicesSecGroup],
      useUnsignedBasicAuth: true,
    });

    const syncFunction = new lambda.Function(this, "app-entities-catalog-dynamodb-syncer", {
      functionName: "app-entities-catalog-opensearch-syncer",
      handler: "index.handler",
      description: "Syncs DynamoDB Catalog with OpenSearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/elasticsearch-syncer")),
      vpc: commonVpc,
      securityGroups: [appSecGroup],
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.minutes(1),
      memorySize: 3096,
      environment: {
        ES_DOMAIN: `${OSDomain.domainEndpoint}`,
        ES_INDEX: "catalog",
        PK: "identifier",
        OS_USER: OSUser,
        OS_PASSWORD: OSPassword,
      },
    });

    const tableArn = Fn.importValue('dynamodb-catalog-table')
    const table = dynamodb.Table.fromTableArn(this, 'catalog-table', tableArn.toString())

    syncFunction.addEventSource(
      new DynamoEventSource(table, {
        batchSize: 100,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        maxRecordAge: Duration.minutes(60),
        retryAttempts: 2,
        bisectBatchOnError: true,
      })
    );

    OSDomain.grantReadWrite(syncFunction);

    syncFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["es:*"],
        resources: ["*"],
      })
    );
  }
}
