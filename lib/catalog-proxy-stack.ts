import { App, aws_elasticache as elasticache, Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { EcrEcsPipeline } from './construct/ecr-ecs-pipeline/ecr-ecs-pipeline-construct';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export interface AppStackProps extends StackProps {
  hostedZone: string;
}

export class CatalogProxyStack extends Stack {
  constructor(scope: App, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    const repositoryArn = Fn.importValue('catalog-ecr-reverse-proxy')
    const repository = ecr.Repository.fromRepositoryArn(this, 'DataGatewaRepository', repositoryArn.toString());

    const clusterArn = Fn.importValue('fargate-common-ecs-cluster')
    const cluster = ecs.Cluster.fromClusterArn(this, 'DataGatewayBackend', clusterArn);

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      isDefault: false,
    });

    const executionRole = new iam.Role(this, 'task-role', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'data-gateway-task-role',
      description: 'Role that the task definitions for data-gateway backend',
    });

    executionRole.attachInlinePolicy(
      new iam.Policy(this, 'data-gateway-task-policy', {
        statements: [
          // policies to allow access to other AWS services from within the container e.g SES (Simple Email Service)
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['logs:*', 'ecr:*', 'iam:*',],
            resources: ['*'],
          }),
        ],
      }),
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'DataGatewayBackendTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      family: `data-gateway`,
      taskRole: executionRole,
    });

    const nginxContainer = taskDefinition.addContainer('nodes-nginx-container', {
      containerName: 'nginx',
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'logsClient' }),
      portMappings: [{ containerPort: 80, hostPort: 80, protocol: ecs.Protocol.TCP }],
    });

    const ecsSG = new ec2.SecurityGroup(this, `service-sg`, {
      vpc,
      description: 'Allows traffic to the node ports of the nginx container',
      allowAllOutbound: true,   // Can be set to false
    });
    ecsSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3030), 'allow http access from the nginx');
    ecsSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3031), 'allow http access from the nginx');
    ecsSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow http/https access from the world');

    const service = new ecs.FargateService(this, 'data-gateway-service', {
      cluster,
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSG],
      assignPublicIp: true,
    });

    const pipeline = new EcrEcsPipeline(this, 'DataGatewayBackendCodePipeline', {
      service: service,
      repository: repository,
      nginxContainer,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'data-gateway2',
      securityGroup: ecsSG,
    });

    const privZone = route53.HostedZone.fromLookup(this, 'PrivateHostedZone', {
      privateZone: true,
      domainName: hostedZone,
    });

    const publicZone = route53.HostedZone.fromLookup(this, 'PublicHostedZone', {
      privateZone: false,
      domainName: hostedZone,
    });

    const certificate = new certificatemanager.Certificate(this, 'DataGatewayBackendCertificate', {
      domainName: hostedZone,
      subjectAlternativeNames: [`catalog.${hostedZone}`],
      validation: certificatemanager.CertificateValidation.fromDns(publicZone),
    });

    const listener = lb.addListener('DataGatewayListener', {
      port: 443,
      certificates: [certificate],
    });

    lb.addRedirect();

    const targetGroup = listener.addTargets('DataGatewayBackend', {
      targetGroupName: 'data-gateway2',
      port: 80,
      targets: [
        service.loadBalancerTarget({
          containerName: nginxContainer.containerName,
          containerPort: 80,
        }),
      ],
    });

    new route53.ARecord(this, 'DataGatewayPrivateAliasRecord', {
      zone: privZone,
      recordName: 'dashboards',
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(lb)),
    });

    new route53.ARecord(this, 'DataGatewayPublicAliasRecord', {
      zone: publicZone,
      recordName: 'dashboards',
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(lb)),
    });

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'CatalogDashboard',
    });

    const cpuUtilizationMetric = service.metricCpuUtilization({
      period: Duration.minutes(1),
      label: 'CPU-Utilization',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        left: [cpuUtilizationMetric],
        width: 12,
        title: 'CPU Utilization',
      }),
    );

    const scalableTaskCount = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 20
    });

    scalableTaskCount.scaleOnCpuUtilization('CpuUtilizationScaling', {
      targetUtilizationPercent: 50
    });

    scalableTaskCount.scaleOnRequestCount('RequestCountScaling', {
      targetGroup: targetGroup,
      requestsPerTarget: 10000
    });
  }
}
