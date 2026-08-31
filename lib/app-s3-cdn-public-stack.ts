import { CfnOutput, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';

interface AppStackProps extends StackProps {
  hostedZone: string;
}

export class AppS3CdnPublicStack extends Stack {
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    const assetsBucket = new s3.Bucket(this, 'app-assets-bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const certificateArn = Fn.importValue('certificate-public');

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    const publicZone = route53.HostedZone.fromLookup(this, 'public-hosted-zone', {
      privateZone: false,
      domainName: hostedZone,
    });

    const cf = new cloudFront.Distribution(this, 'cdn-distribution', {
      defaultBehavior: { origin: new origins.S3Origin(assetsBucket) },
      domainNames: [`*.${hostedZone}`],
      certificate,
    });

    new route53.ARecord(this, 'cdn-arecord', {
      zone: publicZone,
      recordName: `*.${hostedZone}`,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cf)),
    });
      
    new route53.AaaaRecord(this, 'alias-record', {
      zone: publicZone,
      recordName: `*.${hostedZone}`,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cf)),
    });

    new CfnOutput(this, 'app-assets-bucket-output', {
      description: 'S3 Bucket for public assests',
      value: assetsBucket.bucketName,
      exportName: 'app-assets-bucket'
    });
  }
}
