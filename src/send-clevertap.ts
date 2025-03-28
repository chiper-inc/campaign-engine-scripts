// import * as fs from 'fs';
// import * as path from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
import * as UTILS from './utils/index.ts';
import { IClevertapMessage } from './integrations/interfaces.ts';
import { ClevertapIntegration } from './integrations/clevertap.ts';

// Define __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const readFileToJson = (filePath: string): Promise<IClevertapMessage[]> => {
//   return new Promise((resolve, reject) => {
//     fs.readFile(filePath, 'utf8', (err, data) => {
//       if (err) {
//         reject(err);
//       } else {
//         try {
//           resolve(JSON.parse(data));
//         } catch (parseErr) {
//           reject(parseErr as Error);
//         }
//       }
//     });
//   });
// };

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
