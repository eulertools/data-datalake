// START_IN=1 CHAIN_ID=bsc START_PARTITION=2020-08-29 npx ts-node src/init-blockchain-database
// START_IN=1 CHAIN_ID=eth START_PARTITION=2015-07-15 npx ts-node src/init-blockchain-database

const aws = require('aws-sdk');
const s3 = new aws.S3();
const lambda = new aws.Lambda();

require('dotenv').config();

const init = async() => {

    const startIn = process.env.START_IN ? Number.parseInt(process.env.START_IN) : 1;

    let scripts = (await s3.listObjects({ Bucket : process.env.BUCKET_NAME }).promise()).Contents;

    scripts = scripts.map((script:any) => {
        return {
            ...script,
            position: Number.parseInt(script.Key.split('-')[0])
        }
    }).filter((script:any) => script.position >= startIn)
    .sort((a:any, b:any,) => {
        return a.position - b.position;
    })

    for(const script of scripts) {

        const params = {
            FunctionName: 'init-blockchain-db',
            InvocationType: "RequestResponse",
            LogType: "Tail",
            Payload: JSON.stringify({
                chain_id: process.env.CHAIN_ID, 
                start_partition: process.env.START_PARTITION,
                script_key: script.Key
            })
        };

        console.log(`Processing script ${script.Key}`);
    
        const response = JSON.parse((await lambda.invoke(params).promise()).Payload);

        if(response.statusCode !== 200) throw new Error(`Error to process ${script.Key} - ${JSON.parse(response.body).message}`);
        else console.log(`Process script ${script.Key}`);
    }
}

init();