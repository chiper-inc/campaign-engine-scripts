import { Config } from './config.js';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { IConnectlyEntry } from './integrations/interfaces.ts';

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const readFileToJson = (filePath: string): Promise<IConnectlyEntry[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    });
  });
};

// import data from '../data.2025-03-11.json' assert { type: "json" };
// import data from '../xx.json' assert { type: "json" };

const url = `${Config.connectly.apiUrl}/${Config.connectly.businessId}/send/campaigns`;
const API_KEY = Config.connectly.apiKey;  // Replace with a real token if needed
const BATCH_SIZE = Config.connectly.batchSize;

const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY, // Replace with a real token if needed
  };

let accepted = 0;
let rejected = 0;
const rejections: object[] = [];

function splitIntoBatches(
  arr: IConnectlyEntry[], 
  batchSize: number
): IConnectlyEntry[][] {
    return arr.reduce((acc, _, i) => {
        if (i % batchSize === 0) {
          acc.push(arr.slice(i, i + batchSize));
        }
        return acc;
    }, [] as IConnectlyEntry[][]);
}

const scriptForBatches = async (data: IConnectlyEntry[]) => {
  const batches = splitIntoBatches(data, BATCH_SIZE);

  let batchIdx = 1;
  const statuses: { [key: string]: number} = {};
  for (const batch of batches) {
    await Promise.all(batch.map(async (entry)=> {
      const payload = {
        entries: [entry]
      };
      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
        .then(response => {
          statuses[response.status as unknown as string] = (
            statuses[response.status as unknown as string] || 0) + 1;
            return response.json()
        }) 
        .then((response) => {
          if (!response.data) {
            rejections.push({ request: payload, response });
            rejected += 1;
            return;
          }
          // console.log('Rejection Response:', response.data);
          accepted += response.data[0].acceptedCount;
          rejected += response.data[0].rejectedCount;
          if (response.data[0].error) {
            rejections.push({ request: payload, response: response.data });
            // console.error(response.data);
          }
        })
        .catch((error) => {
          rejections.push({ request: payload, response: error.response });
          console.error({ error });
          console.log('Error:', error.response?.data || error.message);
          rejected += 1;
        });
      })).finally(() => {
        console.log(`batch ${batchIdx} of ${batches.length} done, accepted = ${accepted}, rejected = ${rejected}, statuses = ${JSON.stringify(statuses)}`);
      });
    batchIdx += 1;
  };

  rejections.forEach((r, idx) => {
    console.log(`Rejection ${idx}: ${JSON.stringify(r)}`);
  });
}

const script = async (filename: string): Promise<void> => {
  const data: IConnectlyEntry[] = await readFileToJson(path.join(__dirname, filename));
  await scriptForBatches(data);
}

script('../tmp/data.2025-03-15.json').then().catch(console.error);