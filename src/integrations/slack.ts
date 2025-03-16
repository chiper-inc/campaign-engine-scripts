import { Config } from '../config.ts';
import { STORE_STATUS } from '../enums.ts';

export class SlackIntegration {
  private readonly url;

  constructor() {
    this.url = Config.slack.url;
  }

  public async generateSendoutReports(list: {
    city: string;
    status: STORE_STATUS;
    message: string;
    qty: string;
  }[]): Promise<void> {
    if (list.length === 0) return;

    let prevCity = list[0].city;
    let fields: unknown[] = [];
    const promises: Promise<void>[] = [];
  
    const blockHeader = (city: string) => ({ 
      type: 'section',
      text: this.slackTextMarkdown(`📣 Campaign Engine Sendout Report for *${city}*`),
    });

    const blockField = (status: STORE_STATUS, message: string, qty: string) => (
      this.slackTextMarkdown(`*${status}*\nMessage \`${message}\`: ${qty}`)
    )

    const blockSection = (fields: unknown[]) => ({
      type: 'section',
      fields,
    });

    for (const item of list) {
      if (item.city !== prevCity) {
        promises.push(
          this.publishMessage({ 
            blocks: [
              this.slackDivider(),
              blockHeader(prevCity),
              blockSection(fields)
            ],
          }),
        );
        fields = [];
        prevCity = item.city;
      }
      fields.push(blockField(item.status, item.message, item.qty));
    }
    if (fields.length) {
      promises.push(
        this.publishMessage({ 
          blocks: [
            this.slackDivider(),
            blockHeader(prevCity),
            blockSection(fields) 
          ],
        }),
      );
    }
    await Promise.all(promises);
  }
  private async publishMessage(message: unknown): Promise<void> {
    console.error('Sending message to Slack:\n', JSON.stringify(message, null, 2));
    await fetch('https://hooks.slack.com/services/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', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  private slackTextMarkdown(message: string): unknown {
    return {
      type: 'mrkdwn',
      text: message,
    };
  };

  private slackDivider(): unknown {
    return {
      type: 'divider',
    };
  }
}
