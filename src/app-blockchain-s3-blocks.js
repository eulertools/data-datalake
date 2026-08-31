'use strict';
console.log('Loading function');

exports.handler = (event, context, callback) => {
  console.log('Retrieving records from the blocks stream');
  try {
    const output = event.records.map((record) => {
      const data = (new Buffer(record.data, 'base64')).toString('utf8');
      const blocks = JSON.parse(data);
      const payload = (new Buffer(data, 'utf8')).toString('base64');
      console.log({ status: 'success', blockNumber: blocks.number, blockChain: process.env.CHAIN_ID, object: 'blocks' });
      return {
        recordId: record.recordId,
        result: 'Ok',
        data: payload,
      };
    });
    console.log(`Processing completed`);
    console.log(`Successfully wrote ${output.length} records into blocks bucket.`);
    callback(null, { records: output });
  } catch (e) {
    console.log('Failed to write records into blocks bucket', e);
  }
};
