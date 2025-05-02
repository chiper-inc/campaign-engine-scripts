import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapEvent } from './interfaces.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';
import * as UTILS from '../utils/index.ts';
import {
  IMessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';

export class ClevertapIntegration {
  private readonly url: string;

  private readonly headers: { [key: string]: string };
  private readonly queueName: string;
  private readonly backoffSecondsStep: number;
  private readonly batchSize: number = Config.clevertap.batchSize * 8; // 8x
  private readonly waitingTime: number = 750;
  private readonly maxRetries: number = 3;
  private readonly backoffMilisecondsStep: number = 30000; // 30s
  private readonly today = new Date(
    new Date().setHours(0, 0, 0, 0) as unknown as Date, // UTC-5
  );
  private logger: LoggingProvider;

  constructor() {
    this.url = Config.clevertap.apiUrl;
    this.queueName = Config.google.cloudTask.queue;
    this.headers = {
      'X-CleverTap-Account-Id': Config.clevertap.accountId,
      'X-CleverTap-Passcode': Config.clevertap.passcode,
      'Content-Type': 'application/json',
    };
    this.backoffSecondsStep = UTILS.isProduction()
      ? 1800 /* 30m */
      : 15 /* 15s */;
    this.logger = new LoggingProvider({
      context: ClevertapIntegration.name,
      levels:
        LoggingProvider.LOG | LoggingProvider.WARN | LoggingProvider.ERROR,
    });
    this.logger.log({
      message: 'ClevertapIntegration initialized',
      data: {
        url: this.url,
        queueName: this.queueName,
        accountId: this.headers['X-CleverTap-Account-Id'],
        batchSize: this.batchSize,
        backoffSecondsStep: this.backoffSecondsStep,
      },
    });
  }

  public async sendOneEvent(
    event: IClevertapCampaign,
    retry = 0,
  ): Promise<unknown> {
    const { message, inSeconds = 0, timeoutSeconds = 0 } = event;
    const functionName = this.sendOneEvent.name;

    if (retry >= this.maxRetries) {
      this.logger.error({
        message: `Max retries (${this.maxRetries}), reached for sending Clevertap Campaign`,
        functionName,
        error: new Error('Max retries reached'),
        data: { event, inSeconds, timeoutSeconds },
      });
      return null;
    }
    if (retry > 0) await this.blackoff(retry);

    const method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST';
    const request = {
      url: `${this.url}/1/send/externaltrigger.json`,
      method,
      headers: this.headers,
      body: message.data,
    };
    const cloudTask = new CloudTask(this.queueName);
    const name = `Clevertap-Campaign-${message.data.campaign_id}`;
    const scheduledAt = new Date(this.today.getTime() + inSeconds * 1000);
    const timeoutedAt = new Date(this.today.getTime() + timeoutSeconds * 1000);
    const dataRequest = {
      name,
      request,
      scheduledAt: scheduledAt.toISOString(),
      timeoutedAt: timeoutedAt.toISOString(),
    };
    return cloudTask
      .createOneTask({
        name,
        request,
        scheduledAt,
      })
      .then((response) => {
        console.error({
          dataRequest,
          inSeconds,
          timeoutSeconds,
          today: this.today.toISOString(),
        });
        this.logger.log({
          message: 'event.messageRequest.clevertap',
          functionName,
          data: this.generateMetadata(message, {
            scheduledAt,
            timeoutedAt,
          }),
        });
        return response;
      })
      .catch((error) => {
        this.logger.error({
          message: `Error creating cloud task - Retry ${retry}`,
          functionName,
          error,
          data: dataRequest,
        });
        return this.sendOneEvent(
          { message, inSeconds, timeoutSeconds },
          retry + 1,
        );
      });
    // console.log(`Created task ${response.name}`);
  }

  async sendAllEvents(
    events: MessageMetadataList<IClevertapEvent>,
  ): Promise<void> {
    const promises = [];
    let inSeconds = 0;
    // let k = -1;
    // for (const message of messages) {
    //   inSeconds += Math.floor(Math.pow(2, k++)) * this.backoffSecondsStep;
    const minutesBetweenMessages = [
      5 + 9 * 60, // 9h COT
      60,
      120,
      120,
      120,
      120,
    ];
    const timeout = 45 * 60; // 45m
    for (const event of events) {
      inSeconds += (minutesBetweenMessages.shift() ?? 0) * 60; // * 60s
      promises.push(
        this.sendOneEvent({
          message: event,
          inSeconds: inSeconds,
          timeoutSeconds: inSeconds + timeout,
        }),
      );
    }
    await Promise.all(promises);
  }

  async sendAllCampaigns(
    campaings: MessageMetadataList<IClevertapEvent>[],
  ): Promise<void> {
    const functionName = this.sendAllCampaigns.name;

    const promises = [];
    const totalMessages = campaings.reduce(
      (acc, messages) => acc + messages.length,
      0,
    );
    const totalBatches = Math.ceil(totalMessages / this.batchSize);

    this.logger.warn({
      message: `Start Sending Clevertap Campaigns`,
      functionName,
      data: {
        totalBatches,
        batchSize: this.batchSize,
        campaingsLength: campaings.length,
        totalMessages,
        averageMessagesPerCampaign: totalMessages / campaings.length,
      },
    });
    if (totalBatches === 0) {
      this.logger.warn({
        message: `No Clevertap Campaigns to send`,
        functionName,
      });
      return;
    }
    let numBatch = 0;
    let i = 0;
    let j = 0;
    for (const messages of campaings) {
      promises.push(this.sendAllEvents(messages));
      i += messages.length;
      j += messages.length;
      if (i >= this.batchSize) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++numBatch} of ${totalBatches} (Total Messages = ${j}) Clevertap Campaign sending. done`,
          functionName,
          data: {
            batchSize: this.batchSize,
            numBatch,
            totalBatches,
            totalMessages: j,
          },
        });
        await this.sleep();
        promises.length = 0;
        i = 0;
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      this.logger.warn({
        message: `batch ${++numBatch} of ${totalBatches} (Total Messages = ${j} Clevertap Campaign sending. done`,
        functionName,
        data: {
          batchSize: this.batchSize,
          numBatch,
          totalBatches,
          totalMessages: j,
        },
      });
    }
    this.logger.warn({
      message: `End Sending Clevertap Campaigns`,
      functionName,
      data: {
        batchSize: this.batchSize,
        numBatch,
        totalBatches,
        totalMessages: j,
      },
    });
  }

  private generateMetadata(
    event: IMessageMetadata<IClevertapEvent>,
    request: { [key: string]: Date },
  ): object {
    const { data, metadata } = event;

    const recommendations = metadata.map((metadataItem, i) => {
      return metadataItem.expand(i, () => `${data.ExternalTrigger.message}`);
    });

    const timestamp = new Date();
    const scheduledAt = request?.scheduledAt ?? new Date();
    const timeoutedAt = request?.timeoutedAt ?? new Date();

    // scheduledAt.setTime(timestamp.getTime() + (request?.inSeconds ?? 0) * 1000);
    // timeoutedAt.setTime(
    //   timestamp.getTime() + (request?.timeoutSeconds ?? 0) * 1000,
    // );

    const dataEvent = {
      storeId: metadata[0]?.storeId || 0,
      requestedAt: timestamp.toISOString(),
      scheduledAt: scheduledAt.toISOString(),
      timeoutedAt: timeoutedAt.toISOString(),
      clevertap: {
        externalId: data.to.identity[0] || '',
        campaignId: data.campaign_id,
      },
      recommendations,
    };
    return dataEvent;
  }

  private sleep(): Promise<void> {
    return UTILS.sleep(
      this.waitingTime + Math.floor((Math.random() * this.waitingTime) / 2),
    );
  }

  private blackoff(retry: number): Promise<void> {
    return UTILS.sleep(
      Math.pow(2, retry - 1) * this.backoffMilisecondsStep +
        Math.floor((Math.random() * this.backoffMilisecondsStep) / 4),
    );
  }
}
