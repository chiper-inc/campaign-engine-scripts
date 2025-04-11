import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapMessage } from './interfaces.ts';
import {
  LoggingProvider,
  LoggingLevel,
} from '../providers/logging.provider.ts';
import * as UTILS from '../utils/index.ts';

export class ClevertapIntegration {
  private readonly url: string;

  private readonly headers: { [key: string]: string };
  private readonly queueName: string;
  private readonly backoffSecondsStep: number;
  private readonly BATCH_SIZE: number = Config.clevertap.batchSize;
  private readonly WAITING_TIME: number = 750;
  private readonly maxRetries: number = 3;

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
      levels: LoggingLevel.WARN | LoggingLevel.ERROR,
    });
    this.logger.log({
      message: 'ClevertapIntegration initialized',
      data: {
        url: this.url,
        queueName: this.queueName,
        accountId: this.headers['X-CleverTap-Account-Id'],
        BATCH_SIZE: this.BATCH_SIZE,
        backoffSecondsStep: this.backoffSecondsStep,
      },
    });
  }

  public async sendOneMessage(
    { message, inSeconds, timeoutSeconds }: IClevertapCampaign,
    retry = 0,
  ): Promise<unknown> {
    if (retry >= this.maxRetries) return null;
    if (retry > 0) await this.sleep();

    const functionName = this.sendOneMessage.name;

    const method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST';
    const request = {
      url: `${this.url}/1/send/externaltrigger.json`,
      method,
      headers: this.headers,
      body: message,
    };
    const cloudTask = new CloudTask(this.queueName);
    const name = `Clevertap-Campaign-${message.campaign_id}`;
    return cloudTask
      .createOneTask({
        name,
        request,
        inSeconds,
        timeoutSeconds,
      })
      .then((response) => {
        this.logger.log({
          message: 'Cloud Task created successfully',
          functionName,
          data: {
            request: { name, request, inSeconds, timeoutSeconds },
            response,
          },
        });
        return response;
      })
      .catch((error) => {
        this.logger.error({
          message: `Error creating cloud task - Retry ${retry}`,
          functionName,
          error,
          data: { request: { name, request, inSeconds, timeoutSeconds } },
        });
        return this.sendOneMessage(
          { message, inSeconds, timeoutSeconds },
          retry + 1,
        );
      });
    // console.log(`Created task ${response.name}`);
  }

  async sendAllMessages(messages: IClevertapMessage[]): Promise<void> {
    const promises = [];
    let inSeconds = 0;
    let k = -1;
    for (const message of messages) {
      inSeconds += Math.floor(Math.pow(2, k)) * this.backoffSecondsStep;
      k++;
      promises.push(
        this.sendOneMessage({ message: message, inSeconds: inSeconds }),
      );
    }
    await Promise.all(promises);
  }

  async sendAllCampaigns(campaings: IClevertapMessage[][]): Promise<void> {
    const functionName = this.sendAllCampaigns.name;

    const promises = [];
    const totalBatches = Math.ceil(campaings.length / this.BATCH_SIZE);

    this.logger.warn({
      message: `Start Sending Clevertap Campaigns`,
      functionName,
      data: {
        totalBatches,
        BATCH_SIZE: this.BATCH_SIZE,
        campaingsLength: campaings.length,
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
    for (const messages of campaings) {
      promises.push(this.sendAllMessages(messages));
      if (promises.length >= this.BATCH_SIZE) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++numBatch} of ${totalBatches} Clevertap Campaign sending. done`,
          functionName,
          data: { BATCH_SIZE: this.BATCH_SIZE, numBatch, totalBatches },
        });
        await this.sleep();
        promises.length = 0;
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      this.logger.warn({
        message: `batch ${++numBatch} of ${totalBatches} Clevertap Campaign sending. done`,
        functionName,
        data: { BATCH_SIZE: this.BATCH_SIZE, numBatch, totalBatches },
      });
    }
    this.logger.warn({
      message: `End Sending Clevertap Campaigns`,
      functionName,
      data: { BATCH_SIZE: this.BATCH_SIZE, numBatch, totalBatches },
    });
  }

  private sleep(): Promise<void> {
    return UTILS.sleep(
      this.WAITING_TIME + Math.floor((Math.random() * this.WAITING_TIME) / 2),
    );
  }
}
