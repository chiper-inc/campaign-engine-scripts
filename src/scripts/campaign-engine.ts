import { v4 as uuid } from 'uuid';
import * as UTILS from '../utils/index.ts';
import { BASE_DATE, CHANNEL_PROVIDER } from '../constants.ts';

import {
  getLocationStatusRangeKey,
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
} from '../parameters.ts';

import {
  IConnectlyEntry,
  IClevertapMessage,
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

// Process Gobal Variables

const TODAY = new Date(new Date().setHours(0, 0, 0, 0) as unknown as Date);
const UUID = uuid();
// Main Function

async function main({
  day,
  limit = 100000,
  offset = 0,
  includeShortlinks = false,
  sendToConnectly = false,
  sendToClevertap = false,
}: {
  day: number;
  limit?: number;
  offset?: number;
  includeShortlinks?: boolean;
  sendToConnectly?: boolean;
  sendToClevertap?: boolean;
}) {
  const storeReferenceProvider = new StoreRecommendationProvider(
    BASE_DATE,
    UUID,
  );
  const data = await executeQueryBigQuery();
  const storeMap = storeReferenceProvider.assignCampaignAndUtm(
    storeReferenceProvider.generateMap(
      data.filter((row) => filterData(row, frequencyMap, day)),
      day,
    ),
    day,
  );
  const communications = new CommunicationProvider()
    .generateEntries(storeMap)
    .slice(offset, offset + limit);
  const exceptionStoreIds = await Promise.all([
    new DeeplinkProvider().generateLinks(communications, includeShortlinks),
    new GenAiProvider().generateCampaignMessages(communications),
  ]);
  const [connectlyEntries, clevertapEntries] = splitcommunications(
    communications,
    new Set(exceptionStoreIds.flat()),
  );

  // clevertapEntries.slice(0, 10).forEach((entry) => {
  //   console.error({
  //     var: entry.campaignService?.variables,
  //     vars: entry.campaignService?.messages.map((m) => m.variables),
  //   });
  // });

  // connectlyEntries.slice(0, 10).forEach((entry) => {
  //   console.error({ entry });
  //   console.error({
  //     var: entry.campaignService?.variables,
  //     vars: entry.campaignService?.messages.map((m) => m.variables),
  //   });
  // });

  const slackProvider = new SlackProvider(TODAY);

  const [connectlyMessages] = await Promise.all([
    outputIntegrationMessages(CHANNEL.WhatsApp, connectlyEntries) as Promise<
      IConnectlyEntry[][]
    >,
    slackProvider.reportMessagesToSlack(
      CHANNEL.WhatsApp,
      connectlyEntries,
      storeMap,
    ),
  ]);
  const [clevertapCampaigns] = await Promise.all([
    outputIntegrationMessages(
      CHANNEL.PushNotification,
      clevertapEntries,
    ) as Promise<IClevertapMessage[][]>,
    slackProvider.reportMessagesToSlack(
      CHANNEL.PushNotification,
      clevertapEntries,
      storeMap,
    ),
  ]);
  await sendCampaingsToIntegrations(
    connectlyMessages,
    clevertapCampaigns,
    sendToConnectly,
    sendToClevertap,
  );
  console.error(
    `Campaing ${UUID} send from ${offset + 1} to ${offset + limit}`,
  );
}

//Helper Functions

const outputIntegrationMessages = async (
  channel: CHANNEL,
  communications: ICommunication[],
) => {
  const entries: (IConnectlyEntry | IClevertapMessage)[][] = communications.map(
    (communication) =>
      communication.campaignService?.integrationBody as (
        | IConnectlyEntry
        | IClevertapMessage
      )[],
  );

  const formattedToday = UTILS.formatYYYYMMDD(TODAY);
  await UTILS.uploadJsonToGoogleCloudStorage(
    `sender/${formattedToday.slice(0, 7)}/${(
      CHANNEL_PROVIDER[channel] ?? 'Unknown'
    ).toLowerCase()}/${channel}.${formattedToday}.${UUID}.json`,
    entries,
  );
  // console.log(JSON.stringify(entries, null, 2));
  console.error(
    `Campaing ${UUID} generated for ${entries.length} stores as ${channel}`,
  );
  return entries;
};

const sendCampaingsToIntegrations = async (
  connectlyEntries: IConnectlyEntry[][],
  clevertapEntries: IClevertapMessage[][],
  sendToConnectly: boolean,
  sendToClevertap: boolean,
) => {
  const connectlyIntegration = new ConnectlyIntegration();
  const clevertapIntegration = new ClevertapIntegration();
  const promises: Promise<void>[] = [];
  if (sendToConnectly) {
    promises.push(connectlyIntegration.sendAllEntries(connectlyEntries.flat()));
  }
  if (sendToClevertap) {
    promises.push(clevertapIntegration.sendAllCampaigns(clevertapEntries));
  }
  await Promise.all(promises);
};

const splitcommunications = (
  communications: ICommunication[],
  exceptionStoreIds: Set<number>,
) => {
  console.error(
    'date,medium,cityId,segement,storeId,recommendation1,recommendation2,recommendation3,recomendation4,recomendation5',
  );
  return communications
    .filter((communication) => !exceptionStoreIds.has(communication.storeId))
    .reduce(
      (acc, communication) => {
        const { storeId, utm } = communication;
        const { cityId, term, asset, segment } = UTILS.campaignFromString(
          utm.campaignName,
        );
        // console.log('=====');
        const products = communication.utmCallToActions.map((item) => {
          const {
            callToAction: { storeReferenceId, referencePromotionId },
          } = item;
          return storeReferenceId
            ? String(storeReferenceId)
            : `C-${referencePromotionId}`;
        });
        console.error(
          `${term},${asset},${cityId},${segment},${storeId},${products.join(',')}`,
        );
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

// Repository functions

function executeQueryBigQuery(): Promise<IStoreSuggestion[]> {
  const bigQueryRepository = new BigQueryRepository();
  return bigQueryRepository.selectStoreSuggestions(
    frequencyByLocationAndStatusAndRange,
    [CHANNEL.WhatsApp, CHANNEL.PushNotification],
  );
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
