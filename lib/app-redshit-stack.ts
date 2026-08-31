import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as redShift from "aws-cdk-lib/aws-redshift";

export class AppRedShiftStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpcId = ssm.StringParameter.valueFromLookup(
      this,
      "/vpc-legacy/vpc/id"
    );

    const vpc = ec2.Vpc.fromLookup(this, "vpc", {
      vpcId,
    });

    const publicSubnetId = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    }).subnetIds;

    const role = new iam.Role(this, "redshift-policy", {
      assumedBy: new iam.ServicePrincipal("redshift.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
      ],
    });

    const clusterSubnetGroup = new redShift.CfnClusterSubnetGroup(
      this,
      "redshift-cluster-subnet-group",
      {
        subnetIds: publicSubnetId,
        description: "Redshift Cluster Subnet Group",
      }
    );

    const redShiftSG = new ec2.SecurityGroup(this, "redshift-security-group", {
      vpc,
      securityGroupName: "redshift-sg",
    });

    redShiftSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5439),
      "Allow QuickSight connetions"
    );

    const redShiftCluster = new redShift.CfnCluster(this, "redshift-cluster", {
      clusterType: "single-node",
      dbName: "redshift-cluster",
      masterUsername: "redshift",
      masterUserPassword: "RedShift1",
      nodeType: "dc2.large",
      iamRoles: [role.roleArn],
      clusterSubnetGroupName: clusterSubnetGroup.ref,
      vpcSecurityGroupIds: [redShiftSG.securityGroupId],
    });

    new CfnOutput(this, "redshift-cluster-endpoint-address", {
      value: redShiftCluster.attrEndpointAddress,
    });
  }
}
