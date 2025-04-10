import { v4 as uuid } from 'uuid';

// Constants

import * as UTILS from '../utils/index.ts';
// import * as CLEVERATAP from '../mocks/clevertap-campaigns.mock.ts';
// import { Config } from '../config.ts';
import {
  // campaignsBySatatus,
  getLocationStatusRangeKey,
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
  // campaignMap,
  // getCampaignKey,
} from '../parameters.ts';
import { BASE_DATE, CHANNEL_PROVIDER, CITY_NAME } from '../constants.ts';
// import { StoreReferenceMap } from '../mocks/store-reference.mock.ts';
import {
  // ICallToAction,
  IConnectlyEntry,
  IClevertapMessage,
  // IUtm,
} from '../integrations/interfaces.ts';
import { CHANNEL } from '../enums.ts';
// import {
//   TypeCampaignEntry,
//   TypeSku,
//   TypeStore,
//   TypeCampaignVariables,
//   TypeStoreParams,
// } from '../types.ts';
import { BigQueryRepository } from '../repositories/big-query.ts';
import {
  IStoreSuggestion /* , OFFER_TYPE */,
} from '../repositories/interfaces.ts';
import { SlackIntegration } from '../integrations/slack.ts';
// import { CampaignFactory } from '../providers/campaign.factory.ts';
import { CampaignProvider } from '../providers/campaign.provider.ts';
// import { MessageProvider } from '../providers/message.provider.ts';
import { ConnectlyCampaignProvider } from '../providers/connectly.campaign.provider.ts';
import { ClevertapCampaignProvider } from '../providers/clevertap.campaign.provider.ts';
import { ConnectlyIntegration } from '../integrations/connectly.ts';
import { ClevertapIntegration } from '../integrations/clevertap.ts';
// import { getCampaignSegmentName } from '../parameters/campaigns.ts';
import { Logger } from 'logging-chiper';
import { GenAiProvider } from '../providers/gen-ai.provider.ts';
import { DeeplinkProvider } from '../providers/deeplink.provider.ts';
import {
  ICommunication /* , IUtmCallToAction */,
} from '../providers/interfaces.ts';
import { StoreRecommendationProvider } from '../providers/store-recomendation.provider.ts';
import { CommunicationProvider } from '../providers/comunication.provider.ts';

// Process Gobal Variables

const today = new Date().setHours(0, 0, 0, 0) as unknown as Date;
const UUID = uuid();
Logger.init({
  projectId: 'Campaign Engine',
  service: 'Script: Campaign Engine',
});

// Main Function

async function main({
  day,
  limit = 15000,
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
  //   console.error({
  //     var: entry.campaignService?.variables,
  //     vars: entry.campaignService?.messages.map((m) => m.variables),
  //   });
  // });

  const [connectlyMessages] = await Promise.all([
    outputIntegrationMessages(CHANNEL.WhatsApp, connectlyEntries) as Promise<
      IConnectlyEntry[][]
    >,
    reportMessagesToSlack(CHANNEL.WhatsApp, connectlyEntries),
  ]);
  const [clevertapCampaigns] = await Promise.all([
    outputIntegrationMessages(
      CHANNEL.PushNotification,
      clevertapEntries,
    ) as Promise<IClevertapMessage[][]>,
    reportMessagesToSlack(CHANNEL.PushNotification, clevertapEntries),
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

const reportMessagesToSlack = async (
  channel: CHANNEL,
  communications: ICommunication[],
): Promise<void> => {
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
        const [cityId, , , , , , status] = name.split('_');

        const message = campaignService.getMessageName();
        const keyLocation = `${CITY_NAME[cityId]}|${status}|${message}`;
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
  await slackIntegration.generateSendoutMessageReports(channel, summaryMessage);

  console.error('Summary Per Campaign');
};

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
  // .flat();
  await UTILS.writeJsonToFile(
    `tmp/${(
      CHANNEL_PROVIDER[channel] ?? 'Unknown'
    ).toLowerCase()}.${UTILS.formatYYYYMMDD(new Date())}.json`,
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
  return communications
    .filter((communication) => !exceptionStoreIds.has(communication.storeId))
    .reduce(
      (acc, communication) => {
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

// const generatecommunications = (
//   storesMap: Map<number, IStoreRecommendation>,
// ): ICommunication[] => {
//   const entries: ICommunication[] = [];
//   for (const data of Array.from(storesMap.values())) {
//     const {
//       store,
//       campaign,
//       skus,
//       utm: coreUtm,
//       params: { communicationChannel: channel },
//     } = data;

//     const {
//       variables,
//       offers,
//     }: {
//       variables?: TypeCampaignVariables;
//       offers?: IOffer[];
//     } = generateVariablesAndRecommendations(campaign.variables, {
//       store,
//       skus,
//     }) ?? {
//       variables: undefined,
//       offers: undefined,
//     };

//     if (!variables || !offers) continue;

//     campaign.paths.forEach((path) => {
//       variables[path] = path;
//     });

//     const campaignService = CampaignFactory.createCampaignService(
//       channel,
//       store,
//       campaign.name,
//       variables,
//       coreUtm,
//       'es',
//     );

//     const utmCallToActions = generateCallToActionPaths(
//       campaignService.messages,
//       campaign.paths,
//       store.storeId,
//       offers,
//     );

//     if (!utmCallToActions) continue;

//     const utmCallToAction = generateCallToAction(
//       coreUtm,
//       store.storeId,
//       offers,
//     );

//     entries.push({
//       storeId: store.storeId,
//       campaignService,
//       connectlyEntry: undefined,
//       clevertapEntry: undefined,
//       utm: coreUtm,
//       utmCallToAction,
//       utmCallToActions,
//     });
//   }
//   // console.error(JSON.stringify(entries, null, 2));
//   return entries;
// };

// const generateVariablesAndRecommendations = (
//   variablesList: string[],
//   obj: {
//     store: TypeStore;
//     skus: TypeSku[];
//   },
// ): {
//   variables: TypeCampaignVariables;
//   offers: IOffer[];
// } | null => {
//   const typeMap: { [k: string]: string } = {
//     name: 'store',
//     sgmt: 'store',
//     sku: 'skus',
//     dsct: 'skus',
//     img: 'skus',
//     // prc: 'skus',
//   };
//   const subTypeMap: { [k: string]: string } = {
//     name: 'name',
//     sgmt: 'storeStatus',
//     sku: 'reference',
//     dsct: 'discountFormatted',
//     img: 'image',
//   };
//   const offers = [];
//   let variables: TypeCampaignVariables = {};
//   for (const variable of variablesList) {
//     const [varName, varIndex] = variable.split('_');
//     const property = (obj as { [k: string]: TypeStore | TypeSku[] })[
//       typeMap[varName]
//     ];

//     if (!property) {
//       variables = { ...variables, [variable]: `Variable[${variable}]` };
//     } else if (varIndex) {
//       const resp = getVariableFromSku(
//         variable,
//         property as TypeSku[],
//         Number(varIndex) - 1,
//         subTypeMap[varName],
//       );

//       if (!resp) return null;

//       variables = { ...variables, ...resp.variable };
//       if (resp.offer) {
//         offers.push(resp.offer ?? 0);
//       }
//     } else {
//       const resp = getVariableFromStore(
//         variable,
//         property as TypeStore,
//         subTypeMap[varName],
//       );

//       if (!resp) return null;

//       variables = { ...variables, ...resp };
//     }
//   }
//   return { variables, offers };
// };

// const getVariableFromStore = (
//   variable: string,
//   store: TypeStore,
//   varName: string = '-',
// ): TypeCampaignVariables => {
//   const value =
//     (store as TypeCampaignVariables)[varName || '-'] ?? `Store[${variable}]`;
//   return {
//     [variable]: UTILS.removeExtraSpaces(value) || 'Visitante',
//   };
// };

// const getVariableFromSku = (
//   variable: string,
//   skus: TypeSku[],
//   index: number,
//   varName: string = '_',
// ): {
//   variable: TypeCampaignVariables;
//   offer?: IOffer;
// } | null => {
//   if (isNaN(index) || index < 0) return null;

//   if (!Array.isArray(skus)) return null;

//   if (index >= skus.length) return null;

//   const sku = skus[index];
//   const value =
//     (sku as { [k: string]: string | number })[varName] ?? `Sku[${variable}]`;

//   if (!variable.startsWith('sku')) {
//     return {
//       variable: {
//         [variable]: UTILS.removeExtraSpaces(value),
//       },
//     };
//   }

//   const offer = {
//     type: sku.skuType,
//     storeReferenceId:
//       sku.storeReferenceId === null ? undefined : sku.storeReferenceId,
//     referencePromotionId:
//       sku.referencePromotionId === null ? undefined : sku.referencePromotionId,
//   };
//   return {
//     variable: {
//       [variable]: UTILS.removeExtraSpaces(value),
//       [`type_${index + 1}`]: offer.type,
//     },
//     offer,
//   };
// };

// const generateCallToActionPaths = (
//   messageServices: MessageProvider[],
//   paths: string[],
//   storeId: number,
//   offers: IOffer[],
// ): IUtmCallToAction[] | null => {
//   const pathObj = [];
//   for (const path of paths.filter((e) => e.startsWith('path'))) {
//     const [, index]: string[] = path.split('_');
//     if (!path) return null;
//     let callToAction: Partial<ICallToAction> = {};
//     let utm: IUtm | undefined = undefined;
//     if (index && index !== 'dsct') {
//       if (isNaN(Number(index))) {
//         // path_n
//         callToAction = generateCallToActionToOfferList(offers);
//         utm = messageServices[0]?.utm;
//       } else {
//         const i = Number(index) - 1;
//         callToAction = generateCallToActionToOfferDetail(offers[i]);
//         utm = messageServices[i]?.utm ?? messageServices[0]?.utm;
//       }
//     } else {
//       callToAction = generateCallToActionToDiscountList();
//       utm = messageServices[0]?.utm;
//     }
//     pathObj.push({
//       storeId,
//       utm: { ...utm, campaignContent: uuid() },
//       callToAction,
//     });
//   }

//   return pathObj.length ? pathObj : null;
// };

// const generateCallToAction = (
//   utm: IUtm,
//   storeId: number,
//   offers: IOffer[],
// ): IUtmCallToAction => {
//   let callToAction: Partial<ICallToAction> = {};
//   if (offers.length === 1) {
//     callToAction = generateCallToActionToOfferDetail(offers[0]);
//   } else if (offers.length > 1) {
//     // 2 or more skus then C2A_OFFER_LIST
//     callToAction = generateCallToActionToOfferList(offers);
//   } else {
//     // NO Sku included
//     callToAction = generateCallToActionToDiscountList();
//   }
//   return {
//     callToAction,
//     storeId,
//     utm,
//     // campaignService: CampaignFactory.createCampaignService(channel, 'es', utm),
//   };
// };

// const generateCallToActionToOfferList = (offers: IOffer[]) => ({
//   actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
//   storeReferences: offers.map(
//     ({ type, storeReferenceId, referencePromotionId }) =>
//       type === OFFER_TYPE.storeReference
//         ? String(storeReferenceId)
//         : `C-${referencePromotionId}`,
//   ),
// });

// const generateCallToActionToOfferDetail = (
//   offer: IOffer,
// ): Partial<ICallToAction> => {
//   const { type, storeReferenceId, referencePromotionId } = offer;
//   const { reference, referencePromotion } =
//     Config.lbApiOperaciones.callToAction;

//   return type === OFFER_TYPE.storeReference
//     ? { actionTypeId: reference, storeReferenceId }
//     : { actionTypeId: referencePromotion, referencePromotionId };
// };

// const generateCallToActionToDiscountList = () => ({
//   actionTypeId: Config.lbApiOperaciones.callToAction.discountList, // TO DO: When new section is created
//   storeReferenceIds: undefined,
// });

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

main({
  day: UTILS.daysFromBaseDate(today),
  includeShortlinks: includeParam(args, 'link'),
  sendToClevertap: includeParam(args, 'clevertap'),
  sendToConnectly: includeParam(args, 'connectly'),
})
  .then()
  .catch((err) => {
    Logger.getInstance().error({
      stt: 'script',
      message: err.message,
      error: err,
    });
  });
