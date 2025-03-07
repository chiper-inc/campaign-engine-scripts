import data from './empty.json' assert { type: "json" };
// import data from '../data.2025-03-06.json' assert { type: "json" };
import { Config } from './config.js';

/* 
curl  --location 'https://api.connectly.ai/v1/businesses/1ca5c793-9859-4763-94fc-f82838fe6472/send/campaigns' \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: CHANGE_TO_API_KEY' \
  --data '{
		"entries": [
				{
						"client": "CHANGE_TO_TARGET_PHONE_NUMBER",
						"campaignName": "api lead 4 es v0",
						"variables": {}
				}
		]
}'
*/

console.log({ Config });

const url = `${Config.connectly.apiUrl}/${Config.connectly.businessId}/send/campaigns`;
const API_KEY = Config.connectly.apiKey;  // Replace with a real token if needed
const BATCH_SIZE = Config.connectly.batchSize;

const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY, // Replace with a real token if needed
  };

let accepted = 0;
let rejected = 0;

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
        if (!response.data) {
          rejected += 1;
          return;
        }
        // console.log('Response:', response.data);
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


