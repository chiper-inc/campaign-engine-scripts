import { Config } from '../config.ts';
import { STORE_STATUS } from '../enums.ts';

export class SlackIntegration {
  private readonly reportUrl;

  constructor() {
    this.reportUrl = Config.slack.reportUrl;
  }

  public async generateSendoutLocationSegmentReports(
    list: {
      city: string;
      status: STORE_STATUS;
      message: string;
      qty: number;
    }[],
  ): Promise<void> {
    if (list.length === 0) return;

    const blockHeader = (city: string, qty: number): unknown => ({
      type: 'section',
      text: this.slackTextMarkdown(
        `📣 Campaign Engine Sendout Report for *${
          city
        }* ℹ️\n\n*📊 Number of Messages*: ${qty}\n\nDetails per segment:`,
      ),
    });

    const blockMessageField = (
      status: STORE_STATUS,
      message: string,
      qty: number,
    ): unknown =>
      this.slackTextMarkdown(`*${status}*\nMessage \`${message}\`: ${qty}`);

    const composeMessage = (
      city: string,
      fields: unknown[],
      qtyCity: number,
    ): unknown => {
      return {
        blocks: [
          this.slackDivider(),
          blockHeader(city, qtyCity),
          ...this.slackBlockSection(fields),
        ],
      };
    };

    let prevCity = list[0].city;
    let qtyCity = 0;
    let fields: unknown[] = [];
    for (const item of list) {
      if (item.city !== prevCity) {
        await this.publishMessage(composeMessage(prevCity, fields, qtyCity));
        fields = [];
        prevCity = item.city;
        qtyCity = 0;
      }
      fields.push(blockMessageField(item.status, item.message, item.qty));
      qtyCity += item.qty;
    }
    if (fields.length) {
      await this.publishMessage(composeMessage(prevCity, fields, qtyCity));
    }
  }

  public async generateSendoutMessageReports(
    list: {
      messageName: string;
      qty: number;
    }[],
  ): Promise<void> {
    if (list.length === 0) return;

    const blockHeader = (qty: number): unknown => ({
      type: 'section',
      text: this.slackTextMarkdown(
        `📣 Campaign Engine Sendout Report Summary\n\n*🧾 Total Number of Messages*: ${qty} 📈\n\nDetails per Campaign Mesagge:`,
      ),
    });

    const blockMessageField = (message: string, qty: number): unknown =>
      this.slackTextMarkdown(`*${message}*: ${qty}`);

    const composeMessage = (fields: unknown[], qtyMessage: number): unknown => {
      return {
        blocks: [
          this.slackDivider(),
          blockHeader(qtyMessage),
          ...this.slackBlockSection(fields),
          this.slackDivider(),
        ],
      };
    };

    let qtyMessage = 0;
    const fields: unknown[] = [];
    for (const item of list) {
      fields.push(blockMessageField(item.messageName, item.qty));
      qtyMessage += item.qty;
    }
    await this.publishMessage(composeMessage(fields, qtyMessage));
  }

  private async publishMessage(message: unknown): Promise<void> {
    await fetch(this.reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
      .then((response) => {
        console.error('Slack Response:', response.status, response.statusText);
      })
      .catch((error) => {
        console.error('ERROR:', error);
      });
  }

  private slackTextMarkdown(message: string): unknown {
    return {
      type: 'mrkdwn',
      text: message,
    };
  }

  private slackBlockSection(fields: unknown[]): unknown[] {
    const sections = [];
    for (let i = 0; i < fields.length; i += 10) {
      sections.push({
        type: 'section',
        fields: fields.slice(i, i + 10),
      });
    }
    return sections;
  }

  private slackDivider(): unknown {
    return {
      type: 'divider',
    };
  }
}
