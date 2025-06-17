import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';

import { IMetaEvent } from './interfaces.ts';
import * as UTILS from '../utils/index.ts';
import {
  IMessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';

export class MetaGatewayIntegration {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly batchSize: number;
  private readonly headers: { [key: string]: string };
  private readonly logger: LoggingProvider;
  private readonly WAITING_TIME: number = 1250;

  constructor() {
    this.url = `${Config.metaGateway.apiUrl}/waba/${Config.metaGateway.appId}/messages/${Config.metaGateway.sourcePhoneId}/carousels`;
    this.apiKey = Config.metaGateway.apiKey; // Replace with a real token if needed
    this.batchSize = Config.metaGateway.batchSize;
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
    this.logger = new LoggingProvider({
      context: MetaGatewayIntegration.name,
      levels:
        LoggingProvider.LOG | LoggingProvider.WARN | LoggingProvider.ERROR,
    });
    this.logger.log({
      message: 'MeteGateway Integration initialized',
      data: {
        url: this.url,
        batchSize: this.batchSize,
        headers: this.headers,
      },
    });
  }

  public async sendOneEvent(entry: IMessageMetadata<IMetaEvent>): Promise<{
    status: number;
    statusText: string;
    data?: unknown;
  }> {
    const payload = { ...entry.data, toPhoneNumber: '+573153108376' };

    return fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        return {
          status: response.status,
          statusText: response.statusText,
          ...(200 <= response.status && response.status < 300
            ? { data: (await response.json()) as unknown }
            : {}),
        };
      })
      .catch((error) => {
        this.logger.error({
          functionName: this.sendOneEvent.name,
          message: 'Error Sending Meta Entry',
          error,
          data: { payload, url: this.url, headers: this.headers },
        });
        throw error;
      });
  }

  public async sendAllEvents(
    events: MessageMetadataList<IMetaEvent>,
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
          const payload = entry.data;
          return this.sendOneEvent(entry)
            .then((response) => {
              statuses[response.status as unknown as string] =
                (statuses[response.status as unknown as string] || 0) + 1;

              if (!response.data) {
                rejected += 1;
                rejections.push({ request: payload, response });
                return;
              }

              accepted += 1;
              const data = response.data as unknown as {
                content: unknown;
              };
              this.logger.log({
                message: 'event.messageRequest.metaGateway',
                functionName,
                data: this.generateMetadata(entry, data),
              });
            })
            .catch((error) => {
              rejections.push({ request: payload, response: error.response });
              rejected += 1;
              this.logger.error({
                functionName,
                message: 'Error Sending Meta Entries',
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
    campaigns: MessageMetadataList<IMetaEvent>[],
  ): Promise<void> {
    return this.sendAllEvents(campaigns.flat());
  }

  private splitIntoBatches(
    list: MessageMetadataList<IMetaEvent>,
    batchSize: number,
  ): MessageMetadataList<IMetaEvent>[] {
    return list.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        acc.push(list.slice(i, i + batchSize));
      }
      return acc;
    }, [] as MessageMetadataList<IMetaEvent>[]);
  }

  private generateMetadata(
    event: IMessageMetadata<IMetaEvent>,
    response: { [k: string]: unknown },
  ): object {
    const { data, metadata } = event;

    const cards: string[] = data.content.carousel.cards.map(
      (card) => card.body['0'].text,
    );
    const recommendations = metadata.map((metadataItem, i) => {
      return metadataItem.expand(i, (i) => `${cards[i ?? 0]}`);
    });
    const timestamp = new Date().toISOString();
    const dataEvent = {
      storeId: metadata[0]?.storeId || 0,
      requestedAt: timestamp,
      scheduledAt: timestamp,
      metaGateway: {
        input: data.toPhoneNumber,
        content: response.content,
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
