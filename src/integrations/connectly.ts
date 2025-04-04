import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';

import { IConnectlyEntry } from './interfaces.ts';

export class ConnectlyIntegration {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly batchSize: number;
  private readonly headers: { [key: string]: string };
  private readonly logger: LoggingProvider;

  constructor() {
    this.url = `${Config.connectly.apiUrl}/${Config.connectly.businessId}/send/campaigns`;
    this.apiKey = Config.connectly.apiKey; // Replace with a real token if needed
    this.batchSize = Config.connectly.batchSize;
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
    this.logger = new LoggingProvider({ 
      context: ConnectlyIntegration.name, 
      levels: ['warn', 'error'],
    });
    this.logger.log({
      message: 'ConnectlyIntegration initialized',
      data: {
        url: this.url,
        batchSize: this.batchSize,
        headers: this.headers,
      },
    });
  }

  public async sendOneEntries(entry: IConnectlyEntry): Promise<{
    status: number;
    statusText: string;
    data?: unknown[];
  }> {
    const payload = {
      entries: [entry],
    };
    return fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    }).then(async (response) => {
      return {
        status: response.status,
        statusText: response.statusText,
        ...(response.status !== 200
          ? {}
          : { data: (await response.json()).data as unknown as unknown[] }),
      };
    });
  }

  public async sendAllEntries(data: IConnectlyEntry[]) {
    const functionName = this.sendAllEntries.name;
    
    const batches = this.splitIntoBatches(data, this.batchSize);

    let accepted = 0;
    let rejected = 0;
    const rejections: object[] = [];

    let batchIdx = 1;
    const statuses: { [key: string]: number } = {};
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (entry) => {
          const payload = {
            entries: [entry],
          };
          return this.sendOneEntries(entry)
            .then((response) => {
              statuses[response.status as unknown as string] =
                (statuses[response.status as unknown as string] || 0) + 1;
              if (!response.data) {
                rejections.push({ request: payload, response });
                rejected += 1;
                return;
              }
              // console.error('Rejection Response:', response.data);
              const data = response.data as unknown as {
                acceptedCount: number;
                rejectedCount: number;
                error: string | null;
              }[];
              accepted += data[0].acceptedCount;
              rejected += data[0].rejectedCount;
              if (data[0].error) {
                rejections.push({ request: payload, response: data });
                // console.error(response.data);
              }
            })
            .catch((error) => {
              rejections.push({ request: payload, response: error.response });
              console.error({ error });
              console.error('Error:', error.response?.data || error.message);
              rejected += 1;
            });
        }),
      ).finally(() => {
        this.logger.warn({
          functionName,
          message: `batch ${batchIdx} of ${batches.length} done, accepted = ${accepted}, rejected = ${rejected}, statuses = ${JSON.stringify(statuses)}`,
          data: { batchIdx, batches: batches.length, accepted, rejected, statuses },
        })
      });
      batchIdx += 1;
    }

    rejections.forEach((rejection, idx) => {
      this.logger.error({
        functionName,
        message: `Rejection ${idx}`,
        error: new Error('Rejection'),
        data: { rejection },
      });
    });
  }

  private splitIntoBatches(
    arr: IConnectlyEntry[],
    batchSize: number,
  ): IConnectlyEntry[][] {
    return arr.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        acc.push(arr.slice(i, i + batchSize));
      }
      return acc;
    }, [] as IConnectlyEntry[][]);
  }
}
