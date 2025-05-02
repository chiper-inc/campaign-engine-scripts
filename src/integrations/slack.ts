import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';
import { CHANNEL, STORE_STATUS } from '../enums.ts';
import { IReportSkuSummary } from './interfaces.ts';
import * as UTILS from '../utils/index.ts';

export class SlackIntegration {
  private readonly reportUrl;
  private readonly logger: LoggingProvider;
  private readonly today: string;

  constructor(today: Date) {
    this.reportUrl = Config.slack.reportUrl;
    this.today = UTILS.formatYYYYMMDD(today);
    this.logger = new LoggingProvider({
      context: SlackIntegration.name,
      levels: LoggingProvider.WARN | LoggingProvider.ERROR,
    });
  }

  public async generateSendoutTopSkuReports(
    channel: CHANNEL,
    list: [string, IReportSkuSummary[]][],
  ): Promise<void> {
    if (list.length === 0) return;

    const TOP = 10;
    const ranking = [
      ':one:',
      ':two:',
      ':three:',
      ':four:',
      ':five:',
      ':six:',
      ':seven:',
      ':eight:',
      ':nine:',
      ':keycap_ten:',
    ];

    const blockHeader = (
      channel: CHANNEL,
      city: string,
      top: number,
      total: number,
    ): unknown => ({
      type: 'section',
      text: this.slackTextMarkdown(
        `:alert: Campaign Engine *${channel}*'s Report 📊\n\n\n🧾 Top ${top} of *${total}* Recommendations for *${
          city
        }* on *${this.today}* :calendar:`,
      ),
    });

    const blockMessageSku = (skuSummary: IReportSkuSummary, i: number) => {
      const discount = skuSummary.referenceDiscount
        ? `\n:point_right: ${skuSummary.referenceDiscount} Off`
        : '';
      const percentage = skuSummary.percentage?.toFixed(2);
      return {
        type: 'section',
        text: this.slackTextMarkdown(
          `${ranking[i]} *${skuSummary.referenceName}*${discount}\n\n:anger: Stores: *${percentage}%*`,
        ),
        accessory: this.slackImageAccessory(
          skuSummary.referenceImage,
          skuSummary.referenceId,
        ),
      };
    };

    const composeMessage = (
      city: string,
      top: number,
      products: unknown[],
      total: number,
    ) => ({
      blocks: [
        this.slackDivider(),
        blockHeader(channel, city, top, total),
        ...products,
        this.slackDivider(),
      ],
    });

    for (const [city, skuSummaryList] of list) {
      const products = skuSummaryList
        .map((skuSummary, index) =>
          index < TOP
            ? [this.slackDivider(), blockMessageSku(skuSummary, index)]
            : [],
        )
        .flat();
      await this.publishMessage(
        composeMessage(city, TOP, products, skuSummaryList.length),
      );
    }
  }

  public async generateSendoutLocationSegmentReports(
    channel: CHANNEL,
    list: {
      city: string;
      status: STORE_STATUS;
      message: string;
      qty: number;
    }[],
  ): Promise<void> {
    if (list.length === 0) return;

    const blockHeader = (
      channel: CHANNEL,
      city: string,
      qty: number,
    ): unknown => ({
      type: 'section',
      text: this.slackTextMarkdown(
        `📣 Campaign Engine *${channel}*'s Sendout Report for *${
          city
        }* on *${this.today}* :calendar:\n\n*📊 Number of ${channel} Messages*: ${qty}\n\nDetails per segment:`,
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
          blockHeader(channel, city, qtyCity),
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
    channel: CHANNEL,
    list: {
      messageName: string;
      qty: number;
    }[],
  ): Promise<void> {
    if (list.length === 0) return;

    const blockHeader = (channel: CHANNEL, qty: number): unknown => ({
      type: 'section',
      text: this.slackTextMarkdown(
        `📣 Campaign Engine *${channel}*'s Sendout Report Summary on *${this.today}* :calendar:\n\n*🧾 Total Number of ${channel} Messages*: ${qty} 📈\n\nDetails per Campaign Mesagge:`,
      ),
    });

    const blockMessageField = (message: string, qty: number): unknown =>
      this.slackTextMarkdown(`*${message}*: ${qty}`);

    const composeMessage = (fields: unknown[], qtyMessage: number): unknown => {
      return {
        blocks: [
          this.slackDivider(),
          blockHeader(channel, qtyMessage),
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
    const functionName = this.publishMessage.name;

    const request = {
      method: 'POST',
      url: this.reportUrl,
      body: message,
    };
    await fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
    })
      .then((response) => {
        this.logger.log({
          message: 'Slack message sent successfully',
          functionName,
          data: { request, response },
        });
      })
      .catch((error) => {
        this.logger.error({
          message: 'Error sending Slack message',
          functionName,
          error,
          data: { request },
        });
      });
  }

  private slackImageAccessory(imageUrl: string, altText: string): unknown {
    return {
      type: 'image',
      image_url: imageUrl,
      alt_text: altText,
    };
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
