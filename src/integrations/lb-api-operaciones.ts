import { Config } from '../config.ts';
import { StoreReferenceMap } from '../mocks/store-reference.mock.ts';
import { IShortLinkPayload, IShortLinkPayloadAndKey } from './interfaces.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class LbApiOperacionesIntegration {
  url;
  apiKey; // Replace with a real token if needed
  BATCH_SIZE;
  headers;
  WAITING_TIME = 750;

  constructor(batchSize = 10) {
    this.BATCH_SIZE = batchSize;

    this.url = `${Config.lbApiOperaciones.apiUrl}`;
    this.apiKey = Config.lbApiOperaciones.apiKey; // Replace with a real token if needed
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: Config.lbApiOperaciones.apiKey
        ? Config.lbApiOperaciones.apiKey
        : `Bearer ${Config.lbApiOperaciones.apiToken}`, // Replace with a real token if needed
    };

    // console.log(this);
  }

  async createOneShortLink(payload: IShortLinkPayload) {
    const url = `${Config.lbApiOperaciones.apiUrl}/operational/create-external-action`;
    if (payload?.callToAction?.storeReferenceId) {
      payload.callToAction.referenceId = StoreReferenceMap.get(
        payload.callToAction.storeReferenceId,
      )?.referenceId as number;
    }
    // console.log({ headers: this.headers, payload });
    return fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.status !== 200) {
          console.error('ERROR:', response.status, ':', response.statusText);
          return null;
        }
        return response.json();
      })
      .catch((error) => {
        console.error('ERROR:', error);
        return null;
      });
  }

  splitIntoBatches(
    arr: IShortLinkPayloadAndKey[],
    batchSize: number,
  ): IShortLinkPayloadAndKey[][] {
    return arr.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        acc.push(arr.slice(i, i + batchSize));
      }
      return acc;
    }, [] as IShortLinkPayloadAndKey[][]);
  }

  async createAllShortLink(
    payloadsAndKeys: IShortLinkPayloadAndKey[],
  ): Promise<{ key: string; response: unknown }[]> {
    // console.log({ payloadsAndKeys });
    let responses: { key: string; response: unknown }[] = [];
    const batches = this.splitIntoBatches(payloadsAndKeys, this.BATCH_SIZE);
    const batchCount = batches.length;
    let batchIdx = 0;
    console.error(
      `Creating ${payloadsAndKeys.length} shortLinks in ${batchCount} batches of ${this.BATCH_SIZE}...`,
    );
    for (const batch of batches) {
      const batchResponse: {
        key: string;
        response: unknown;
      }[] = await Promise.all(
        batch.map(async ({ key, value }) => {
          return new Promise((resolve, reject) => {
            this.createOneShortLink(value)
              .then((result) => {
                resolve({ key, response: result });
              })
              .catch((error) => {
                console.error('ERROR - :', error, value, key, '-');
                reject(error);
              });
          });
        }),
      );
      // console.log(JSON.stringify(batchResponse, null, 2));
      responses = responses.concat(batchResponse);
      console.error(
        `batch ${++batchIdx} of ${batchCount} done. ${responses.length} responses.`,
      );
      await sleep(
        this.WAITING_TIME + Math.floor((Math.random() * this.WAITING_TIME) / 2),
      );
    }
    // console.log('=======\n', JSON.stringify(responses, null, 2), "\n=======");
    return responses;
  }
}
