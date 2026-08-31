export const BuildSpecContent = {
  version: '0.2',
  phases: {
    install: {
      'runtime-versions': {
        nodejs: '14',
      },
      commands: [],
    },
    pre_build: {
      commands: [
        'echo Entering into pre build stage',
        'echo Logging in to Amazon ECR...',
        'aws ecr get-login-password --region $ACCOUNT_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$ACCOUNT_REGION.amazonaws.com',
        'REPOSITORY_URI=$IMAGE_URI',
        'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
        'echo Pre Build Stage Completed',
      ],
    },
    build: {
      commands: [
        'echo Entering into Build Stage',
        'echo Build Started',
        'echo Building the Docker image...',
        'docker login -u tebayoso -p 47bfc937-94fb-4ba1-90e8-a92b754ea9ae',
        'cd $DIR_NAME',
        'docker build -t $REPOSITORY_URI:latest .',
        'echo Image Build Successfully...',
        'docker images',
        'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$TAG',
        'echo Image tagged Successfully...',
        'cd ../..',
      ],
    },
    post_build: {
      commands: [
        'echo Entering into Post Build Stage',
        'echo Post Build Started',
        'echo Pushing Image to ECR Repository',
        'docker push $REPOSITORY_URI:latest',
        'echo Image Pushed into ECR Successfully..'
      ],
    },
  },
  artifacts: {
    files: [],
  },
};
