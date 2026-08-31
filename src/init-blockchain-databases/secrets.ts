require('dotenv').config();

const AWS = require('aws-sdk');

export async function getSecret (secretName:string){

    const config = { region : process.env.AWS_REGION }

    var secret, decodedBinarySecret;

    let secretsManager = new AWS.SecretsManager(config);
    try {

        let secretValue = await secretsManager.getSecretValue({SecretId: secretName}).promise();

        if ('SecretString' in secretValue) {
            return secret = secretValue.SecretString;
        } else {
            let buff = new Buffer(secretValue.SecretBinary, 'base64');
            return decodedBinarySecret = buff.toString('ascii');
        }
    } catch (err) {
        throw err;
    }
} 