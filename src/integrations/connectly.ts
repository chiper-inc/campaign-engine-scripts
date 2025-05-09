import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';

import { IConnectlyEvent } from './interfaces.ts';
import * as UTILS from '../utils/index.ts';
import {
  IMessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';

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
      levels:
        LoggingProvider.LOG | LoggingProvider.WARN | LoggingProvider.ERROR,
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

  public async sendOneEvent(entry: IMessageMetadata<IConnectlyEvent>): Promise<{
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

  public async sendAllEvents(
    events: MessageMetadataList<IConnectlyEvent>,
  ): Promise<void> {
    const functionName = this.sendAllEvents.name;

    const batches = this.splitIntoBatches(events, this.batchSize);

    let accepted = 0;
    let rejected = 0;
    const rejections: object[] = [];

    let batchIdx = 1;
    const statuses: { [key: string]: number } = {};
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (entry) => {
          const payload = {
            entries: [entry.data],
          };
          return this.sendOneEvent(entry)
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
              } else {
                this.logger.log({
                  message: 'event.messageRequest.connectly',
                  functionName,
                  data: this.generateMetadata(entry, data[0]),
                });
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

  public async sendAllCampaigns(
    campaigns: MessageMetadataList<IConnectlyEvent>[],
  ): Promise<void> {
    return this.sendAllEvents(campaigns.flat());
  }

  private splitIntoBatches(
    list: MessageMetadataList<IConnectlyEvent>,
    batchSize: number,
  ): MessageMetadataList<IConnectlyEvent>[] {
    return list.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        acc.push(list.slice(i, i + batchSize));
      }
      return acc;
    }, [] as MessageMetadataList<IConnectlyEvent>[]);
  }

  private generateMetadata(
    event: IMessageMetadata<IConnectlyEvent>,
    response: { [k: string]: unknown },
  ): object {
    const { data, metadata } = event;

    const recommendations = metadata.map((metadataItem, i) => {
      return metadataItem.expand(
        i,
        (i) => `${data.variables[`sku_${(i ?? 0) + 1}`]}`,
      );
    });
    const timestamp = new Date().toISOString();
    const dataEvent = {
      storeId: metadata[0]?.storeId || 0,
      requestedAt: timestamp,
      scheduledAt: timestamp,
      connectly: {
        externalId: data.client,
        campaignId: response?.campaignId,
        campaignName: response?.campignName,
        campaignVersion: response?.campaignVersion,
        sendoutId: response?.sendoutId,
      },
      recommendations,
    };
    return dataEvent;
  }

  private sleep(): Promise<void> {
    return UTILS.sleep(
      this.WAITING_TIME + Math.floor((Math.random() * this.WAITING_TIME) / 2),
    );
  }
}
