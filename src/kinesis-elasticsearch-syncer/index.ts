import { KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';
import { Client } from '@opensearch-project/opensearch';
import { DynamoDB } from 'aws-sdk';

const host = 'https://' + (process.env.ES_DOMAIN as string);
const index = process.env.ES_INDEX as string;
const username = process.env.OS_USER || ''
const password = process.env.OS_PASSWORD || ''

const client = new Client({
  node: host,
  auth: {
    username,
    password
  }
});

export const handler = async (event: KinesisStreamEvent, context:any, callback:any) => {

  console.log('DynamoDB to ES synchronize event triggered');

  const records = event.Records.map((record: KinesisStreamRecord) => {
    const payload = Buffer.from(record.kinesis.data, 'base64').toString('ascii');
    return JSON.parse(payload);
  });

  for (const record of records.filter((item: any) => item.dynamodb)) {

    try {

      let result;

      const keys = record.dynamodb!.Keys;

      console.log(JSON.stringify(record));

      const id = keys?.[process.env.PK!].S;

      if (!id) {
        console.log(
          `Can not detect the ID of the document to index. Make sure the DynamoDB document has a field called '${process.env.PK}'`,
        );
        continue;
      }

      if (record.eventName === 'REMOVE') {
        console.log(`Deleting document: ${id}`);
        // eslint-disable-next-line no-await-in-loop
        result = await client.delete({
          index,
          id,
        });

      } else {
        if (!record.dynamodb!.NewImage) {
          console.log(
            'Trying to index new document but the DynamoDB stream event did not provide the NewImage. Skipping...',
          );
          continue;
        }

        console.log(`Indexing document: ${id}`);
        const convertedDocument = DynamoDB.Converter.output({ M: record.dynamodb!.NewImage });
        delete convertedDocument.raw;

        console.log('The full object to store is: ', convertedDocument);
        // eslint-disable-next-line no-await-in-loop
        result = await client.index({
          index,
          id,
          body: convertedDocument,
        });
      }

      console.log(result);
    } catch (e) {
      console.error('Failed to process DynamoDB row');
      console.error(record);
      console.error(e);
    }
  }
};
