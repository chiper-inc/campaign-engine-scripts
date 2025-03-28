// import * as fs from 'fs';
// import * as path from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
import * as UTILS from './utils/index.ts';
import { IConnectlyEntry } from './integrations/interfaces.ts';
import { ConnectlyIntegration } from './integrations/connectly.ts';

// Define __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const readFileToJson = (filePath: string): Promise<IConnectlyEntry[]> => {
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

const script = async (filename: string): Promise<void> => {
  const data = (await UTILS.readFileToJson(filename)) as IConnectlyEntry[];
  const connectlyIntegration = new ConnectlyIntegration();
  await connectlyIntegration.sendAllEntries(data.flat());
};

const args = process.argv;
if (args.length < 3) {
  console.error('Please provide a filename as an argument.');
  process.exit(1);
}
script(args[2]).then().catch(console.error);
