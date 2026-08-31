import { App, aws_secretsmanager, CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { aws_rds as rds } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
interface RdsInstanceProps extends StackProps {
  chainId: string;
}

export class AppRdsInstancesStack extends Stack {
  constructor(scope: App, id: string, props?: RdsInstanceProps) {
    super(scope, id, props);

    const { chainId } = props!;

    const vpc = ec2.Vpc.fromLookup(this, 'defaultVpc', {
      isDefault: false
    });

    const credsSecretName = `databases/chain/${chainId}`;

    const dbcreds = new aws_secretsmanager.Secret(this, `${chainId}-blockchain-dbcredentials-secret`, {
      secretName: credsSecretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      }
    });

    const dBInstance = new rds.DatabaseInstance(this, `${chainId}DataBlockchainDB`, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_12_9,
      }),
      availabilityZone: 'us-east-1c',
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.LARGE
      ),
      instanceIdentifier: `${chainId}-Data-Blockchain-DB`,
      credentials: rds.Credentials.fromSecret(dbcreds),
      multiAz: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 105,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'mainnet',
      publiclyAccessible: true,
    });

    const roleArn = Fn.importValue('init-blockchain-db-role-arm');

    const role = iam.Role.fromRoleArn(this,
      'initDBLambdaRole',
      roleArn.toString(),
      {mutable: false},
    );
    
    dbcreds.grantRead(role);

    new CfnOutput(this, `${chainId}DBEndpoint`, {
      value: dBInstance.instanceEndpoint.hostname,
    });

    new CfnOutput(this, `${chainId}DBSecretName`, {
      value: dBInstance.secret?.secretName!,
    });

    dBInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(5432));
  }
}