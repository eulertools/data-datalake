import { handler } from '../src/init-blockchain-databases'

describe('Init blockchain database', () => {

  let event:any;
  let context:any;

  beforeAll(() => {
    jest.setTimeout(150000);

    event = {
      chain_id:'bsc', 
      start_partition: '2020-08-29', 
      script_key: '003-03-schema-002-create-partman.sql'
    };
    context = {};
  });

  it('execute script correctly', async (done) => {

    try {
      const result = await handler(event, context);
      console.log(result);
      expect(result.statusCode).toBe(200);
      done();
    } catch (e) {
      done.fail(e)
    }
  });
});

