import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapEvent } from './interfaces.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';
import * as UTILS from '../utils/index.ts';
import {
  IMessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';
import { google } from '@google-cloud/tasks/build/protos';

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
  private eventLogger: LoggingProvider;
  private readonly cloudTask: CloudTask;

  constructor() {
    this.url = Config.clevertap.apiUrl;
    this.queueName = Config.google.cloudTask.queue;
    this.cloudTask = new CloudTask(this.queueName);
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
      levels: LoggingProvider.WARN | LoggingProvider.ERROR,
    });
    this.eventLogger = new LoggingProvider({
      context: `${ClevertapIntegration.name}Event`,
      levels: LoggingProvider.LOG,
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

  public async generateOneEvent(event: IClevertapCampaign): Promise<{
    cloudTask: google.cloud.tasks.v2.ITask;
    onInjectionCompleted: () => void;
  } | null> {
    const functionName = this.generateOneEvent.name;

    const { message, inSeconds = 0, timeoutSeconds = 0 } = event;

    const method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST';
    const request = {
      url: `${this.url}/1/send/externaltrigger.json`,
      method,
      headers: this.headers,
      body: message.data,
    };
    // const cloudTask = new CloudTask(this.queueName);
    const name = `Clevertap-Campaign-${message.data.campaign_id}`;
    const scheduledAt = new Date(this.today.getTime() + inSeconds * 1000);
    const timeoutedAt = new Date(this.today.getTime() + timeoutSeconds * 1000);
    return this.cloudTask.generateOneTask(
      {
        name,
        request,
        scheduledAt,
      },
      () =>
        this.eventLogger.log({
          message: 'event.messageRequest.clevertap',
          functionName,
          data: this.generateMetadata(message, {
            scheduledAt,
            timeoutedAt,
          }),
        }),
    );
  }

  async sendAllEvents(
    events: MessageMetadataList<IClevertapEvent>,
  ): Promise<unknown[]> {
    const cloudTasks = [];
    let inSeconds = 0;
    // let k = -1;
    // for (const message of messages) {
    //   inSeconds += Math.floor(Math.pow(2, k++)) * this.backoffSecondsStep;
    const minutesBetweenMessages = [
      5 * 60 + 9 * 60, // 9h COT
      60,
      120,
      120,
      120,
      120,
    ];
    const timeout = 45 * 60; // 45m
    for (const event of events) {
      inSeconds += (minutesBetweenMessages.shift() ?? 0) * 60; // * 60s
      cloudTasks.push(
        this.generateOneEvent({
          message: event,
          inSeconds: inSeconds,
          timeoutSeconds: inSeconds + timeout,
        }),
      );
    }
    return Promise.all(cloudTasks);
  }

  async sendAllCampaigns(
    campaings: MessageMetadataList<IClevertapEvent>[],
    retry = 0,
  ): Promise<void> {
    const functionName = this.sendAllCampaigns.name;

    const promises: unknown[][] = [];
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
      promises.push(await this.sendAllEvents(messages));
      i += messages.length;
      j += messages.length;
      if (i >= this.batchSize) {
        await this.injectAllEvents(
          {
            payload: promises.flat() as {
              cloudTask: google.cloud.tasks.v2.ITask;
              onInjectionCompleted: () => void;
            }[],
            numBatch: numBatch++,
            totalBatches,
            totalMessages: j,
          },
          retry,
        );
        promises.length = 0;
        i = 0;
      }
    }
    if (promises.length > 0) {
      await this.injectAllEvents(
        {
          payload: promises.flat() as {
            cloudTask: google.cloud.tasks.v2.ITask;
            onInjectionCompleted: () => void;
          }[],
          numBatch: numBatch++,
          totalBatches,
          totalMessages: j,
        },
        retry,
      );
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

  private async injectAllEvents(
    {
      payload,
      numBatch,
      totalBatches,
      totalMessages,
    }: {
      numBatch: number;
      totalBatches: number;
      totalMessages: number;
      payload: {
        cloudTask: google.cloud.tasks.v2.ITask;
        onInjectionCompleted: () => void;
      }[];
    },
    retry: number,
  ): Promise<void> {
    const functionName = this.injectAllEvents.name;

    await this.cloudTask
      .injectTasks({
        payload,
        starts: totalMessages - payload.length,
        ends: totalMessages,
      })
      .then(() => {
        this.logger.warn({
          message: `batch ${++numBatch} of ${totalBatches} (Total Messages = ${totalMessages}) Clevertap Campaign sending. done`,
          functionName,
          data: {
            batchSize: this.batchSize,
            numBatch,
            totalBatches,
            totalMessages,
          },
        });
      })
      .catch(async (error) => {
        this.logger.error({
          message: `Error injecting tasks - Retry ${retry}`,
          error: new Error(error as string),
          functionName,
          data: {
            batchSize: this.batchSize,
            numBatch,
            totalBatches,
            totalMessages,
          },
        });
        await this.blackoff(retry);
        return this.cloudTask.injectTasks(
          {
            payload,
            starts: 0,
            ends: payload.length,
          },
          retry + 1,
        );
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
    // console.error(timestamp, scheduledAt, timeoutedAt);

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
