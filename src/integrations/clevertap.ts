import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapMessage } from './interfaces.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';
import * as UTILS from '../utils/index.ts';

export class ClevertapIntegration {
  private readonly url: string;

  private readonly headers: { [key: string]: string };
  private readonly queueName: string;
  private readonly backoffSecondsStep: number;
  private readonly batchSize: number;
  private logger: LoggingProvider;

  constructor() {
    this.url = Config.clevertap.apiUrl;
    this.queueName = Config.google.cloudTask.queue;
    this.headers = {
      'X-CleverTap-Account-Id': Config.clevertap.accountId,
      'X-CleverTap-Passcode': Config.clevertap.passcode,
      'Content-Type': 'application/json',
    };
    this.batchSize = Config.clevertap.batchSize;
    this.backoffSecondsStep = UTILS.isProduction() ? 3600 /* 60m */ : 15 /* 15s */;
    this.logger = new LoggingProvider({ context: ClevertapIntegration.name, levels: ['warn', 'error'] });
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

  public async sendOneCampaign({
    message,
    inSeconds,
    timeoutSeconds,
  }: IClevertapCampaign): Promise<void> {
    const functionName = this.sendOneCampaign.name;

    const method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST';
    const request = {
      url: `${this.url}/1/send/externaltrigger.json`,
      method,
      headers: this.headers,
      body: message,
    };
    const cloudTask = new CloudTask(this.queueName);
    const name = `Clevertap-Campaign-${message.campaign_id}`;
    await cloudTask
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
          data: { request: { name, request, inSeconds, timeoutSeconds }, response },
        });
        return response;
      })
      .catch((error) => {
        this.logger.error({
          message: 'Error creating cloud task',
          functionName,
          error,
          data: { request: { name, request, inSeconds, timeoutSeconds } },
        });
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
        this.sendOneCampaign({ message: message, inSeconds: inSeconds }),
      );
    }
    await Promise.all(promises);
  }

  async sendAllCampaigns(campaings: IClevertapMessage[][]): Promise<void> {
    const functionName = this.sendAllCampaigns.name;

    const promises = [];
    const totalBatches = Math.ceil(campaings.length / this.batchSize);

    this.logger.warn({
      message: `Start Sending Clevertap Campaigns`,
      functionName,
      data: { totalBatches, batchSize: this.batchSize, campaingsLength: campaings.length },
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
      if (promises.length >= this.batchSize) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++numBatch} of ${totalBatches} Clevertap Campaign sending. done!`,
          functionName,
          data: { batchSize: this.batchSize, numBatch, totalBatches },
        })
        await UTILS.sleep(
          1000 + Math.floor((Math.random() * 1000) / 2),
        );  
        promises.length = 0;
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      this.logger.warn({
        message: `batch ${++numBatch} of ${totalBatches} Clevertap Campaign sending. done`,
        functionName,
        data: { batchSize: this.batchSize, numBatch, totalBatches },
      });
    }
    this.logger.warn({
      message: `End Sending Clevertap Campaigns`,
      functionName,
      data: { batchSize: this.batchSize, numBatch, totalBatches },
    });
  }
}
