import { v4 as uuid } from 'uuid';
import * as UTILS from '../utils/index.ts';
import { BASE_DATE, CHANNEL_PROVIDER } from '../constants.ts';

import {
  getLocationStatusRangeKey,
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
} from '../parameters.ts';

import {
  IConnectlyEvent,
  IClevertapEvent,
} from '../integrations/interfaces.ts';
import { IStoreSuggestion } from '../repositories/interfaces.ts';
import { ICommunication } from '../providers/interfaces.ts';

import { CHANNEL } from '../enums.ts';
import { BigQueryRepository } from '../repositories/big-query.ts';
import { ConnectlyCampaignProvider } from '../providers/connectly.campaign.provider.ts';
import { ClevertapCampaignProvider } from '../providers/clevertap.campaign.provider.ts';
import { ConnectlyIntegration } from '../integrations/connectly.ts';
import { ClevertapIntegration } from '../integrations/clevertap.ts';
import { Logger } from 'logging-chiper';
import { GenAiProvider } from '../providers/gen-ai.provider.ts';
import { DeeplinkProvider } from '../providers/deeplink.provider.ts';
import { StoreRecommendationProvider } from '../providers/store-recomendation.provider.ts';
import { CommunicationProvider } from '../providers/comunication.provider.ts';
import { SlackProvider } from '../providers/slack.provider.ts';
import { MessageMetadataList } from '../providers/message.metadata.ts';

// Process Gobal Variables

const TODAY = new Date(new Date().setHours(0, 0, 0, 0) as unknown as Date);
const UUID = uuid();
// Main Function

async function main({
  day,
  limit = 1500,
  offset = 15000,
  includeShortlinks = false,
  sendToConnectly = false,
  sendToClevertap = false,
  includeGenAi = false,
}: {
  day: number;
  limit?: number;
  offset?: number;
  includeShortlinks?: boolean;
  includeGenAi?: boolean;
  sendToConnectly?: boolean;
  sendToClevertap?: boolean;
}) {
  const storeReferenceProvider = new StoreRecommendationProvider({
    baseDate: new Date(BASE_DATE),
  });
  await storeReferenceProvider.load({ limit, offset, day, filter: filterData });
  await storeReferenceProvider.generateOfferCopyMap();

  const communications = new CommunicationProvider().generateEntries(
    Array.from(storeReferenceProvider.storeMap.values()),
  );

  const exceptionStoreIds = await Promise.all([
    new DeeplinkProvider().generateLinks(communications, includeShortlinks),
    new GenAiProvider().generateCampaignMessages(communications, includeGenAi),
  ]);

  const [connectlyEvents, clevertapEvents] = splitcommunications(
    communications,
    new Set(exceptionStoreIds.flat()),
  );

  const slackProvider = new SlackProvider(TODAY);

  const [connectlyCampaigns] = await Promise.all([
    outputIntegrationMessages<IConnectlyEvent>(
      CHANNEL.WhatsApp,
      connectlyEvents,
    ),
    slackProvider.reportMessagesToSlack(
      CHANNEL.WhatsApp,
      connectlyEvents,
      storeReferenceProvider.storeMap,
    ),
  ]);
  const [clevertapCampaigns] = await Promise.all([
    outputIntegrationMessages<IClevertapEvent>(
      CHANNEL.PushNotification,
      clevertapEvents,
    ),
    slackProvider.reportMessagesToSlack(
      CHANNEL.PushNotification,
      clevertapEvents,
      storeReferenceProvider.storeMap,
    ),
  ]);
  await sendCampaingsToIntegrations(
    connectlyCampaigns,
    clevertapCampaigns,
    sendToConnectly,
    sendToClevertap,
  );
  console.error(
    `Campaing ${UUID} send from ${offset + 1} to ${offset + limit}`,
  );
}

//Helper Functions

const outputIntegrationMessages = async <T>(
  channel: CHANNEL,
  communications: ICommunication[],
): Promise<MessageMetadataList<T>[]> => {
  const entries: MessageMetadataList<T>[] = communications.map(
    (communication) =>
      communication.campaignService
        ?.integrationBody as unknown as MessageMetadataList<T>,
  );

  const formattedToday = UTILS.formatYYYYMMDD(TODAY);
  await UTILS.uploadJsonToGoogleCloudStorage(
    `sender/${formattedToday.slice(0, 7)}/${(
      CHANNEL_PROVIDER[channel] ?? 'Unknown'
    ).toLowerCase()}/${channel}.${formattedToday}.${UUID}.json`,
    entries,
  );
  console.error(
    `Campaing ${UUID} generated for ${entries.length} stores as ${channel}`,
  );
  return Promise.resolve(entries);
};

const sendCampaingsToIntegrations = async (
  connectlyEvents: MessageMetadataList<IConnectlyEvent>[],
  clevertapEvents: MessageMetadataList<IClevertapEvent>[],
  sendToConnectly: boolean,
  sendToClevertap: boolean,
) => {
  const connectlyIntegration = new ConnectlyIntegration();
  const clevertapIntegration = new ClevertapIntegration();
  const promises: Promise<void>[] = [];
  if (sendToConnectly) {
    promises.push(connectlyIntegration.sendAllCampaigns(connectlyEvents));
  }
  if (sendToClevertap) {
    promises.push(clevertapIntegration.sendAllCampaigns(clevertapEvents));
  }
  await Promise.all(promises);
};

const splitcommunications = (
  communications: ICommunication[],
  exceptionStoreIds: Set<number>,
) => {
  // console.error(
  //   'date,medium,cityId,segement,storeId,recommendation1,recommendation2,recommendation3,recomendation4,recomendation5',
  // );
  return communications
    .filter((communication) => !exceptionStoreIds.has(communication.storeId))
    .reduce(
      (acc, communication) => {
        const { storeId, utm } = communication;
        const { cityId, term, asset, segment } = UTILS.campaignFromString(
          utm.campaignName,
        );
        const products = communication.utmCallToActions.map((item) => {
          const {
            callToAction: { storeReferenceId, referencePromotionId },
          } = item;
          return storeReferenceId
            ? String(storeReferenceId)
            : `C-${referencePromotionId}`;
        });
        // console.error(
        //   `${term},${asset},${cityId},${segment},${storeId},${products.join(',')}`,
        // );
        if (
          communication.campaignService instanceof ConnectlyCampaignProvider
        ) {
          acc[0].push(communication);
        } else if (
          communication.campaignService instanceof ClevertapCampaignProvider
        ) {
          acc[1].push(communication);
        }
        return acc;
      },
      [[], []] as [ICommunication[], ICommunication[]],
    );
};

function getFrequency(
  row: IStoreSuggestion,
  frequencyMap: Map<string, number>,
): number {
  const key = getLocationStatusRangeKey(row);
  return frequencyMap.get(key) ?? 0;
}

function filterData(
  row: IStoreSuggestion,
  frequencyMap: Map<string, number>,
  day: number,
) {
  const mod = getFrequency(row, frequencyMap);
  if (!mod) return false;
  return row.storeId % mod === day % mod;
}

// Run Main Function

const args = process.argv.slice(2);
const includeParam = (args: string[], param: string) =>
  args.some((arg) => arg.toLowerCase().startsWith(param.toLowerCase()));

(async () => {
  Logger.init({
    projectId: 'Campaign Engine',
    service: 'Script: Campaign Engine',
  });
  Logger.getInstance().log({
    stt: 'scripting',
    message: 'Engine Script started',
  });
  await main({
    day: UTILS.daysFromBaseDate(TODAY),
    includeShortlinks: includeParam(args, 'link'),
    sendToClevertap: includeParam(args, 'clevertap'),
    sendToConnectly: includeParam(args, 'connectly'),
  });
})()
  .then(() => {
    Logger.getInstance().log({
      stt: 'scripting',
      message: 'Engine Script finished',
    });
    process.exit(0);
  })
  .catch((err) => {
    Logger.getInstance().error({
      stt: 'scripting',
      message: 'Engine Script error',
      error: err,
    });
    process.exit(1);
  });
