import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapEvent } from './interfaces.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';
import * as UTILS from '../utils/index.ts';
import {
  IMessageMetadata,
  MessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';

export class ClevertapIntegration {
  private readonly url: string;

  private readonly headers: { [key: string]: string };
  private readonly queueName: string;
  private readonly backoffSecondsStep: number;
  private readonly batchSize: number = Config.clevertap.batchSize;
  private readonly waitingTime: number = 750;
  private readonly maxRetries: number = 3;
  private readonly backoffMilisecondsStep: number = 30000; // 30s

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
        this.logger.log({
          message: 'event.messageRequest.clevertap',
          functionName,
          data: this.generateMetadata(message, {
            name,
            request,
            inSeconds,
            timeoutSeconds,
          }),
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
    let k = -1;
    for (const event of events) {
      inSeconds += Math.floor(Math.pow(2, k)) * this.backoffSecondsStep;
      k++;
      promises.push(
        this.sendOneEvent({ message: event, inSeconds: inSeconds }),
      );
    }
    await Promise.all(promises);
  }

  async sendAllCampaigns(
    campaings: MessageMetadataList<IClevertapEvent>[],
  ): Promise<void> {
    const functionName = this.sendAllCampaigns.name;

    const promises = [];
    const totalBatches = Math.ceil(campaings.length / this.batchSize);

    this.logger.warn({
      message: `Start Sending Clevertap Campaigns`,
      functionName,
      data: {
        totalBatches,
        batchSize: this.batchSize,
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
    for (const events of campaings) {
      promises.push(this.sendAllEvents(events));
      if (promises.length >= this.batchSize) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++numBatch} of ${totalBatches} Clevertap Campaign sending. done`,
          functionName,
          data: { batchSize: this.batchSize, numBatch, totalBatches },
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
        data: { batchSize: this.batchSize, numBatch, totalBatches },
      });
    }
    this.logger.warn({
      message: `End Sending Clevertap Campaigns`,
      functionName,
      data: { batchSize: this.batchSize, numBatch, totalBatches },
    });
  }

  private generateMetadata(
    event: IMessageMetadata<IClevertapEvent>,
    request: unknown,
  ): object {
    console.log(event);

    const { data, metadata } = event;

    const arr = metadata.map((metadataItem, i) => {
      return metadataItem.expand(i, () => `${data.ExternalTrigger.message}`);
    });
    // const arr = this.f2(metadata, () => `${data.ExternalTrigger.message}`);

    // const metadataItem = metadata[0];

    // const { callToAction } = metadataItem;
    // const obj = {
    //   ...metadataItem,
    //   callToAction: {
    //     ...callToAction,
    //     actionType: MessageMetadata.actionType[callToAction.actionTypeId],
    //   },
    //   skus: func(metadataItem.skus, () => `${data.ExternalTrigger.message}`),
    // };
    console.log(arr);
    console.error(JSON.stringify(arr, null, 2));
    return arr;
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
