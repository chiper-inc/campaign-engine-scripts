import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapMessage } from './interfaces.ts';

export class ClevertapIntegration {
  private readonly url: string;

  private readonly headers: { [key: string]: string };
  private readonly queueName: string;
  private readonly backoffSecondsStep: number;

  constructor() {
    this.url = Config.clevertap.apiUrl;
    this.queueName = Config.google.cloudTask.queue;
    this.headers = {
      'X-CleverTap-Account-Id': Config.clevertap.accountId,
      'X-CleverTap-Passcode': Config.clevertap.passcode,
      'Content-Type': 'application/json',
    };
    this.backoffSecondsStep =
      Config.environment === 'production' ? 3600 /* 60m */ : 15 /* 15s */;
  }

  public async sendOneCampaign({
    message,
    inSeconds,
    timeoutSeconds,
  }: IClevertapCampaign): Promise<void> {
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
      .catch((error) => {
        console.error(
          'Rejection: ',
          JSON.stringify({ name, request, inSeconds, timeoutSeconds }),
        );
        console.error('Error:', error);
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
        this.sendOneCampaign({
          message: message,
          inSeconds: inSeconds,
        }),
      );
    }
    await Promise.all(promises);
  }
}
