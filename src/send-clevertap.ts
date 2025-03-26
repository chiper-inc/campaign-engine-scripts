import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { IClevertapMessage } from './integrations/interfaces.ts';
import { ClevertapIntegration } from './integrations/clevertap.ts';

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readFileToJson = (filePath: string): Promise<IClevertapMessage[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(parseErr as Error);
        }
      }
    });
  });
};

const script = async (filename: string): Promise<void> => {
  const data = await readFileToJson(path.join(__dirname, filename));
  const clevertapIntegration = new ClevertapIntegration();
  let identity = null;
  let messages: IClevertapMessage[] = [];
  for (const message of data) {
    if (identity !== message.to.identity[0]) {
      if (messages.length) {
        console.log(`Sending messages: ${messages.length} to ${identity}`);
        await clevertapIntegration.sendAllMessages(messages);
      }
      messages = [];
      identity = message.to.identity[0];
    }
    messages.push(message);
  }
  if (messages.length) {
    console.log(`Sending messages: ${messages.length} to ${identity}`);
    await clevertapIntegration.sendAllMessages(messages);
  }
};

const args = process.argv;
if (args.length < 3) {
  console.error('Please provide a filename as an argument.');
  process.exit(1);
}
script(args[2]).then().catch(console.error);
