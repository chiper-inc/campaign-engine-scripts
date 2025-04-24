import { ICommunication, IStoreRecommendation } from './interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { CHANNEL, STORE_STATUS } from '../enums.ts';
import { SlackIntegration } from '../integrations/slack.ts';
import { CITY_NAME } from '../constants.ts';
import * as UTILS from '../utils/index.ts';
import { IReportSkuSummary } from '../integrations/interfaces.ts';

export class SlackProvider {
  private readonly date: Date;

  constructor(date: Date) {
    this.date = date;
  }

  reportMessagesToSlack = async (
    channel: CHANNEL,
    communications: ICommunication[],
    storeMap: Map<number, IStoreRecommendation>,
  ): Promise<void> => {
    const summaryMap = communications
      .map(
        (communication) =>
          [
            communication.storeId,
            communication.utm.campaignName,
            communication.campaignService,
          ] as [number, string, CampaignProvider],
      )
      .reduce(
        (acc, [storeId, name, campaignService]) => {
          const { cityId, segment } = UTILS.campaignFromString(name);
          const city = CITY_NAME[cityId];

          let value;
          const skus = (storeMap.get(storeId)?.skus || []).slice(0, 5);
          const storeSet = acc.locationMap.get(city) || new Set<number>();
          storeSet.add(storeId);
          acc.locationMap.set(city, storeSet);

          skus.forEach((sku) => {
            const {
              skuType,
              referencePromotionId,
              storeReferenceId,
              reference,
              image,
              discountFormatted,
            } = sku;
            const skuId =
              skuType === 'storeReferenceId'
                ? String(storeReferenceId)
                : `C-${referencePromotionId}`;
            const referenceDiscount =
              skuType === 'storeReferenceId' ? discountFormatted : null;
            const keySku = `${city}|${skuId}`;
            const referenceValue = acc.locationSegmentSkuMap.get(keySku) || {
              city,
              referenceName: UTILS.removeExtraSpaces(reference) as string,
              referenceImage: image,
              value: 0,
              referenceId: skuId,
              referenceDiscount,
            };
            acc.locationSegmentSkuMap.set(keySku, {
              ...referenceValue,
              value: referenceValue.value + 1,
            });
          });

          const message = campaignService.getMessageName();
          const keyLocation = `${city}|${segment}|${message}`;
          value = acc.locationSegmentMessageMap.get(keyLocation) || 0;
          acc.locationSegmentMessageMap.set(keyLocation, value + 1);

          const keyChannel = `${segment}`;
          value = acc.channelSegmentMap.get(keyChannel) || 0;
          acc.channelSegmentMap.set(keyChannel, value + 1);
          return acc;
        },
        {
          locationSegmentMessageMap: new Map<string, number>(),
          channelSegmentMap: new Map<string, number>(),
          locationSegmentSkuMap: new Map<string, IReportSkuSummary>(),
          locationMap: new Map<string, Set<number>>(),
        },
      );

    // console.log(summaryMap.locationSegmentSkuMap);

    const summarySku = Array.from(summaryMap.locationSegmentSkuMap.values())
      .sort((a, b) => a.city.localeCompare(b.city) || b.value - a.value)
      .reduce((acc, curr) => {
        const value = acc.get(curr.city) || [];
        const citySet =
          summaryMap.locationMap.get(curr.city) || new Set<number>();
        const percentage = (curr.value / citySet.size) * 100;
        value.push({
          ...curr,
          percentage: isNaN(percentage) ? undefined : percentage,
        });
        acc.set(curr.city, value);
        return acc;
      }, new Map<string, IReportSkuSummary[]>());

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
        return { city, status: status as STORE_STATUS, message, qty };
      });

    const slackIntegration = new SlackIntegration(this.date);
    await slackIntegration.generateSendoutTopSkuReports(
      channel,
      Array.from(summarySku.entries()),
    );
    await slackIntegration.generateSendoutLocationSegmentReports(
      channel,
      summaryLocationSegmentMessage,
    );
    await slackIntegration.generateSendoutMessageReports(
      channel,
      summaryMessage,
    );

    console.error('Summary Per Campaign');
  };
}
