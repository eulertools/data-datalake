import { Context } from 'aws-lambda';
import { newSequelize } from './sequelize';

require('dotenv').config();

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const replace = (target:string, find:string, replace:string) => {
  find = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return target.replace(new RegExp(find,'g'), replace);
}

const getScript = async (params:any) => {

  let script = (await s3.getObject({
    Bucket : process.env.BUCKET_NAME,
    Key: params.script_key
  }).promise()).Body.toString();
  script = replace(script, '${params.start_partition}',params.start_partition);
  script = replace(script, '${params.chain_id}',params.chain_id);
  return script;
}

export async function handler(event: any, context: Context):Promise<any> {

  const sequelize:any = await newSequelize(event.chain_id);

  const transaction = await sequelize.transaction();

  try {

    console.log(await sequelize.query(await getScript(event), { 
      transaction
    }));

    transaction.commit();

  } catch(error:any) {

    console.log(error);

    await transaction.rollback();

    return {
      body: JSON.stringify({
        message: error.message,
      }),
      statusCode: 500,
    };
  } finally {
    sequelize.close();
  }

  return {
    body: JSON.stringify({
      message: `Executed Lambda Successfully`,
    }),
    statusCode: 200,
  };
}