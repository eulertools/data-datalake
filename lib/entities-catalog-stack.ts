import {
  App,
  aws_certificatemanager as cert,
  aws_opensearchservice as opensearch,
  aws_route53 as route53,
  CfnResource,
  Duration,
  Fn,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";
import * as cognito from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

export interface entitiesCatalogProps extends StackProps {
  hostedZone: string;
}

export class EntitiesCatalogStack extends Stack {
  constructor(scope: App, id: string, props?: entitiesCatalogProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    new CfnResource(this, "es-service-linked-role", {
      type: "AWS::IAM::ServiceLinkedRole",
      properties: {
        AWSServiceName: "es.amazonaws.com",
        Description: "Role for ES to access resources in my VPC",
      },
    });

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

    const certificate = cert.Certificate.fromCertificateArn(
      this,
      "CertificateImported",
      ssm.StringParameter.valueForStringParameter(
        this,
        "/directory/cognito/public-certificate"
      )
    );

    const hostedZoneId = route53.HostedZone.fromLookup(this, "HostedZone", {
      privateZone: false,
      domainName: hostedZone,
    });

    const apiCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "opensearchMasterUser",
      "opensearchMasterUser"
    );

    const OSUser = apiCreds.secretValueFromJson("username").toString();
    const OSPassword = apiCreds.secretValueFromJson("password").toString();

    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "cognito-user-pool-id",
      ssm.StringParameter.fromStringParameterName(
        this,
        "user-pool-id",
        "/directory/cognito/user-pool"
      ).stringValue
    );

    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      "cognito-client-id",
      ssm.StringParameter.fromStringParameterName(
        this,
        "user-pool-client-id",
        "/directory/cognito/user-pool-client-id"
      ).stringValue
    );

    const identityPool = new cognito.CfnIdentityPool(
      this,
      "open-search-identity-pool",
      {
        identityPoolName: "cognito-identity-pool",
        allowUnauthenticatedIdentities: true,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.userPoolClientId,
            providerName: `cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
          },
        ],
      }
    );

    const isAnonymousCognitoGroupRole = new iam.Role(
      this,
      "anonymous-group-role",
      {
        description: "Default role for anonymous users",
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
        ],
      }
    );

    const isUserCognitoGroupRole = new iam.Role(this, "users-group-role", {
      description: "Default role for authenticated users",
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "identity-pool-role-attachment",
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: isUserCognitoGroupRole.roleArn,
          unauthenticated: isAnonymousCognitoGroupRole.roleArn,
        },
        roleMappings: {
          mapping: {
            type: "Token",
            ambiguousRoleResolution: "AuthenticatedRole",
            identityProvider: `cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}:${userPoolClient.userPoolClientId}`,
          },
        },
      }
    );

    const opensearchHttpPolicy = new ManagedPolicy(
      this,
      "opensearchHttpPolicy",
      {
        roles: [isAnonymousCognitoGroupRole, isUserCognitoGroupRole],
      }
    );

    opensearchHttpPolicy.addStatements(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:es:${this.region}:${this.account}:domain/catalogs.${hostedZone}/*`,
        ],
        actions: ["es:*"],
      })
    );

    const role = new iam.Role(this, "cognito-os-role", {
      assumedBy: new ServicePrincipal("opensearchservice.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonOpenSearchServiceCognitoAccess"
        ),
      ],
    });

    const OSDomain = new opensearch.Domain(this, "OSDomain", {
      version: opensearch.EngineVersion.OPENSEARCH_1_2,
      cognitoDashboardsAuth: {
        identityPoolId: identityPool.ref,
        role: role,
        userPoolId: userPool.userPoolId,
      },
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
        masterNodeInstanceType: "r6g.large.search",
        dataNodeInstanceType: "r6g.large.search",
        masterNodes: 3,
        dataNodes: 3,
      },
      ebs: {
        volumeSize: 20,
      },
      zoneAwareness: {
        availabilityZoneCount: 3,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      domainName: "catalogs",
      customEndpoint: {
        domainName: `catalogs.${hostedZone}`,
        certificate: certificate,
        hostedZone: hostedZoneId,
      },
      useUnsignedBasicAuth: true,
    });

    const syncFunction = new lambda.Function(
      this,
      "app-entities-catalog-dynamodb-syncer",
      {
        functionName: "app-entities-catalog-opensearch-syncer",
        handler: "index.handler",
        description: "Syncs DynamoDB Catalog with OpenSearch",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../src/elasticsearch-syncer")
        ),
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: Duration.minutes(1),
        memorySize: 3096,
        environment: {
          ES_DOMAIN: `${OSDomain.domainEndpoint}`,
          ES_INDEX: "catalog_v1",
          PK: "identifier",
          OS_USER: OSUser,
          OS_PASSWORD: OSPassword,
        },
      }
    );

    syncFunction.addEventSource(
      new DynamoEventSource(table, {
        batchSize: 25,
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
