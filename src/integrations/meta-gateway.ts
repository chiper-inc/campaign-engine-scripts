import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';

import { IMetaEvent } from './interfaces.ts';
import * as UTILS from '../utils/index.ts';
import {
  IMessageMetadata,
  MessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';

interface IMetaGatewayRequest {
  metadataArray: MessageMetadata[][];
  messages: IMetaEvent[];
  namePrefix: string;
  scheduledAt?: string;
}
export class MetaGatewayIntegration {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly batchSize: number;
  private readonly headers: { [key: string]: string };
  private readonly logger: LoggingProvider;
  private readonly WAITING_TIME: number = 1250;

  constructor() {
    this.url = `${Config.metaGateway.apiUrl}/waba/${Config.metaGateway.appId}/multiple-messages/${Config.metaGateway.sourcePhoneId}/carousels`;
    this.apiKey = Config.metaGateway.apiKey; // Replace with a real token if needed
    this.batchSize = Config.metaGateway.batchSize;
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
    this.logger = new LoggingProvider({
      context: MetaGatewayIntegration.name,
      levels: LoggingProvider.ERROR,
      // LoggingProvider.LOG | LoggingProvider.WARN | LoggingProvider.ERROR,
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

  public async sendOneEvent(payload: IMetaGatewayRequest): Promise<{
    status: number;
    statusText: string;
    data?: unknown;
  }> {
    payload.messages.forEach(
      (message) => (message.toPhoneNumbers = ['+573153108376']),
    ); // Example phone number, replace with actual

    const body = {
      namePrefix: payload.namePrefix,
      scheduledAt: payload.scheduledAt,
      messages: payload.messages,
    };

    return fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
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
          data: { body, url: this.url, headers: this.headers },
        });
        throw error;
      });
  }

  public async sendAllEvents(events: IMetaGatewayRequest[]): Promise<void> {
    const functionName = this.sendAllEvents.name;

    const batches = this.splitIntoBatches(events, this.batchSize);

    let accepted = 0;
    let rejected = 0;
    const rejections: object[] = [];

    let batchIdx = 1;
    const statuses: { [key: string]: number } = {};
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (event) => {
          return this.sendOneEvent(event)
            .then((response) => {
              statuses[response.status as unknown as string] =
                (statuses[response.status as unknown as string] || 0) + 1;

              if (!response.data) {
                rejected += 1;
                rejections.push({ request: event, response });
                return;
              }

              accepted += 1;
              const data = response.data as unknown as {
                content: unknown;
              };
              this.logEvent(event.messages, event.metadataArray, data);
            })
            .catch((error) => {
              const { messages, namePrefix, scheduledAt } = event;
              rejections.push({
                request: { messages, namePrefix, scheduledAt },
                response: error.response,
              });
              rejected += 1;
              // this.logger.error({
              //   functionName,
              //   message: 'Error Sending Meta Entries',
              //   error,
              //   data: { request: { messages, namePrefix, scheduledAt }, error },
              // });
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
    const batchSize = 128;
    const list = campaigns.flat();

    const events = list.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        const slicedList = list.slice(i, i + batchSize);
        acc.push({
          messages: slicedList.map(({ data }) => ({
            toPhoneNumbers: [data.toPhoneNumber ?? ''],
            content: data.content,
            metadata: data.metadata,
          })),
          namePrefix: 'skdka',
          metadataArray: slicedList.map(({ metadata }) => metadata),
        });
      }
      return acc;
    }, [] as IMetaGatewayRequest[]);
    return this.sendAllEvents(events);
  }

  private splitIntoBatches(
    list: IMetaGatewayRequest[],
    batchSize: number,
  ): IMetaGatewayRequest[][] {
    return list.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        acc.push(list.slice(i, i + batchSize));
      }
      return acc;
    }, [] as IMetaGatewayRequest[][]);
  }

  private logEvent(
    messages: IMetaEvent[],
    metadataArray: MessageMetadata[][],
    data: { [k: string]: unknown },
  ): void {
    const functionName = this.logEvent.name;

    messages.forEach((message, i) => {
      const { content, toPhoneNumbers = [], metadata } = message;
      this.logger.log({
        message: 'event.messageRequest.metaGateway',
        functionName,
        data: this.generateMetadata(
          {
            data: {
              content,
              toPhoneNumber: toPhoneNumbers[0],
              metadata,
            },
            metadata: metadataArray[i] || [],
          },
          data,
        ),
      });
    });
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
