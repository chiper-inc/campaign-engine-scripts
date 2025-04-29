import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';

import { IConnectlyEntry } from './interfaces.ts';
import * as UTILS from '../utils/index.ts';
import { MessageMetadata } from '../providers/message.metadata.ts';

export class ConnectlyIntegration {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly batchSize: number;
  private readonly headers: { [key: string]: string };
  private readonly logger: LoggingProvider;
  private readonly WAITING_TIME: number = 1250;

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
      levels: LoggingProvider.WARN | LoggingProvider.ERROR,
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

  public async sendOneEntry(entry: {
    data: IConnectlyEntry;
    metadata: MessageMetadata[];
  }): Promise<{
    status: number;
    statusText: string;
    data?: unknown[];
  }> {
    const payload = {
      entries: [entry.data],
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

  public async sendAllEntries(
    entries: { data: IConnectlyEntry; metadata: MessageMetadata[] }[],
  ) {
    const functionName = this.sendAllEntries.name;

    const batches = this.splitIntoBatches(entries, this.batchSize);

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
          return this.sendOneEntry(entry)
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
              if (data[0].error) {
                rejections.push({ request: payload, response: data });
                rejected += 1;
              }
            })
            .catch((error) => {
              rejections.push({ request: payload, response: error.response });
              rejected += 1;
              this.logger.error({
                functionName,
                message: 'Error Sending Connectly Entries',
                error,
                data: { payload, error },
              });
            });
        }),
      ).finally(async () => {
        this.logger.warn({
          functionName,
          message: `batch ${batchIdx} of ${batches.length} done, accepted = ${accepted}, rejected = ${rejected}, statuses = ${JSON.stringify(statuses)}`,
          data: {
            batchIdx,
            batches: batches.length,
            accepted,
            rejected,
            statuses,
          },
        });
        await this.sleep();
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
    arr: { data: IConnectlyEntry; metadata: MessageMetadata[] }[],
    batchSize: number,
  ): { data: IConnectlyEntry; metadata: MessageMetadata[] }[][] {
    return arr.reduce(
      (acc, _, i) => {
        if (i % batchSize === 0) {
          acc.push(arr.slice(i, i + batchSize));
        }
        return acc;
      },
      [] as { data: IConnectlyEntry; metadata: MessageMetadata[] }[][],
    );
  }

  private sleep(): Promise<void> {
    return UTILS.sleep(
      this.WAITING_TIME + Math.floor((Math.random() * this.WAITING_TIME) / 2),
    );
  }
}
