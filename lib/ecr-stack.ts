import * as ecr from 'aws-cdk-lib/aws-ecr';
import { App, CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { GithubEcrPipeline } from './construct/github-ecr-pipeline/ecr-ecs-pipeline-construct';

export class ECRStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'CatalogReverseProxy', {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    repository.addLifecycleRule({ tagPrefixList: ['prod'], maxImageCount: 60 });
    repository.addLifecycleRule({ maxImageAge: Duration.days(30) });

    const imagePipeline = new GithubEcrPipeline(this, 'ReverseProxyPipeline', {
      ecrRepository: repository,
      githubRepo: 'data-datalake',
      branchName: 'main',
      directoryName: 'ecr-images/nginx-proxy',
      accountId: this.account,
      region: this.region
    });

    const repositoryName = new CfnOutput(this, 'RepositoryARN', {
      value: repository.repositoryArn,
      description: 'This ECR repository holds the reverse proxy for the kibana dashboards catalog',
      exportName: 'catalog-ecr-reverse-proxy',
    });
  }
}
