'use strict';
console.log('Loading function');

exports.handler = (event, context, callback) => {
  console.log('Retrieving records from the logs stream');
  try {
    const output = event.records.map((record) => {
      const data = (new Buffer(record.data, 'base64')).toString('utf8');
      const logs = JSON.parse(data);
      const payload = (new Buffer(data, 'utf8')).toString('base64');
      console.log({ status: 'success', logIndex: logs.log_index, blockChain: process.env.CHAIN_ID, object: 'logs' });
      return {
        recordId: record.recordId,
        result: 'Ok',
        data: payload,
      };
    });
    console.log(`Processing completed`);
    console.log(`Successfully wrote ${output.length} records into logs bucket.`);
    callback(null, { records: output });
  } catch (e) {
    console.log('Failed to write records into logs bucket', e);
  }
};
