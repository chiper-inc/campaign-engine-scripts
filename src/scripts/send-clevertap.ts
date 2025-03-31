import * as UTILS from '../utils/index.ts';
import { IClevertapMessage } from '../integrations/interfaces.ts';
import { ClevertapIntegration } from '../integrations/clevertap.ts';

const BATCH_SIZE = 10;

const script = async (filename: string): Promise<void> => {
  const data = (await UTILS.readFileToJson(filename)) as IClevertapMessage[][];
  const clevertapIntegration = new ClevertapIntegration();
  let promises = [];
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);

  if (totalBatches === 0) {
    console.error('No data to send');
    return;
  }
  let numBatch = 0;
  for (const messages of data) {
    promises.push(clevertapIntegration.sendAllMessages(messages));
    if (promises.length >= BATCH_SIZE) {
      await Promise.all(promises);
      console.log(`batch ${++numBatch} of ${totalBatches} done`);
      promises = [];
    }
  }
  await Promise.all(promises);
  console.log(`batch ${++numBatch} of ${totalBatches} done`);
};

const args = process.argv;
if (args.length < 3) {
  console.error('Please provide a filename as an argument.');
  process.exit(1);
}
script(args[2]).then().catch(console.error);
