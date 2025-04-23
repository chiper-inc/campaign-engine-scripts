import { ICommunication } from './interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { CHANNEL } from '../enums.ts';
import { SlackIntegration } from '../integrations/slack.ts';
import { CITY_NAME } from '../constants.ts';
import { campaignFromString } from '../utils/campign-name.ts';

export class SlackProvider {
  private static instance: SlackProvider | null = null;

  public async reportMessagesToSlack(
    channel: CHANNEL,
    communications: ICommunication[],
  ): Promise<void> {
    const summaryMap = communications
      .map(
        (communication) =>
          [communication.utm.campaignName, communication.campaignService] as [
            string,
            CampaignProvider,
          ],
      )
      .reduce(
        (acc, [name, campaignService]) => {
          const { cityId, segment } = campaignFromString(name);

          const message = campaignService.getMessageName();
          const keyLocation = `${CITY_NAME[cityId]}|${segment}|${message}`;
          let value = acc.locationSegmentMessageMap.get(keyLocation) || 0;
          acc.locationSegmentMessageMap.set(keyLocation, value + 1);

          const keyChannel = `${status}`;
          value = acc.channelSegmentMap.get(keyChannel) || 0;
          acc.channelSegmentMap.set(keyChannel, value + 1);
          return acc;
        },
        {
          locationSegmentMessageMap: new Map(),
          channelSegmentMap: new Map(),
        },
      );

    const summaryMessage = Array.from(summaryMap.channelSegmentMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([messageName, qty]) => {
        return { messageName, qty };
      });

    const summaryLocationSegmentMessage = Array.from(
      summaryMap.locationSegmentMessageMap.entries(),
    )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, qty]) => {
        const [city, status, message] = key.split('|');
        return { city, status, message, qty };
      });

    const slackIntegration = new SlackIntegration();
    await slackIntegration.generateSendoutLocationSegmentReports(
      channel,
      summaryLocationSegmentMessage,
    );
    await slackIntegration.generateSendoutMessageReports(
      channel,
      summaryMessage,
    );

    console.error('Summary Per Campaign');
  }
}
