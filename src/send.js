// import data from './empty.json' assert { type: "json" };
import data from '../data.2025-03-09.json' assert { type: "json" };
// import data from '../xx.json' assert { type: "json" };
import { Config } from './config.js';

const url = `${Config.connectly.apiUrl}/${Config.connectly.businessId}/send/campaigns`;
const API_KEY = Config.connectly.apiKey;  // Replace with a real token if needed
const BATCH_SIZE = Config.connectly.batchSize;

const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY, // Replace with a real token if needed
  };

let accepted = 0;
let rejected = 0;
const rejections = [];

function splitIntoBatches(arr, batchSize) {
    return arr.reduce((acc, _, i) => {
        if (i % batchSize === 0) {
          acc.push(arr.slice(i, i + batchSize));
        }
        return acc;
    }, []);
}

const batches = splitIntoBatches(data, BATCH_SIZE);


let batchIdx = 1;
let statuses = {};
for (const batch of batches) {
  await Promise.all(batch.map((entry, idx) => {
    const payload = {
      entries: [entry]
    };
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
      .then(response => {
        statuses[response.status] = (statuses[response.status] || 0) + 1;
           return response.json()
      }) 
      .then((response) => {
        rejections.push({ request: payload, response: response.data});
        if (!response.data) {
          rejected += 1;
          return;
        }
        // console.log('Rejection Response:', response.data);
        accepted += response.data[0].acceptedCount;
        rejected += response.data[0].rejectedCount;
        if (response.data[0].error) {
            rejected += 1;
        }
      })
      .catch((error) => {
        console.error({ error });
        console.log('Error:', error.response?.data || error.message);
        rejected += 1;
      });
    })).finally(() => {
      console.log(`batch ${batchIdx} of ${batches.length} done, accepted = ${accepted}, rejected = ${rejected}, statuses = ${JSON.stringify(statuses)}`);
    });
  batchIdx += 1;
};
console.log(JSON.stringify(rejections, null,  ));


