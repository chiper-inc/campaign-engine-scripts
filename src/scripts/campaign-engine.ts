import { v4 as uuid } from 'uuid';

// Constants

import * as UTILS from '../utils/index.ts';
// import * as CLEVERATAP from '../mocks/clevertap-campaigns.mock.ts';
import { Config } from '../config.ts';
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
  ICallToAction,
  IConnectlyEntry,
  IClevertapMessage,
  IUtm,
} from '../integrations/interfaces.ts';
import { CHANNEL } from '../enums.ts';
import {
  TypeCampaignEntry,
  TypeSku,
  TypeStore,
  TypeCampaignVariables,
  TypeStoreParams,
} from '../types.ts';
import { BigQueryRepository } from '../repositories/big-query.ts';
import { IStoreSuggestion } from '../repositories/interfaces.ts';
import { SlackIntegration } from '../integrations/slack.ts';
import { CampaignFactory } from '../providers/campaign.factory.ts';
import { CampaignProvider } from '../providers/campaign.provider.ts';
import { MessageProvider } from '../providers/message.provider.ts';
import { ConnectlyCampaignProvider } from '../providers/connectly.campaign.provider.ts';
import { ClevertapCampaignProvider } from '../providers/clevertap.campaign.provider.ts';
import { ConnectlyIntegration } from '../integrations/connectly.ts';
import { ClevertapIntegration } from '../integrations/clevertap.ts';
// import { getCampaignSegmentName } from '../parameters/campaigns.ts';
import { Logger } from 'logging-chiper';
import { GenAiProvider } from '../providers/gen-ai.provider.ts';
import { DeeplinkProvider } from '../providers/deeplink.provider.ts';
import { IPreEntry, IUtmCallToAction } from './interfaces.ts';
import { StoreRecomendationProvider } from '../providers/store-recomendation.provider.ts';

export interface IStoreRecomendation {
  store: TypeStore;
  params: TypeStoreParams;
  campaign: TypeCampaignEntry;
  skus: TypeSku[];
  utm: IUtm;
}

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
  const storeReferenceProvider = new StoreRecomendationProvider(
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
  const preEntries = generatePreEntries(storeMap).slice(offset, offset + limit);
  const exceptionStoreIds = await Promise.all([
    new DeeplinkProvider().generateLinks(preEntries, includeShortlinks),
    new GenAiProvider().generateCampaignMessages(preEntries),
  ]);
  const [connectlyEntries, clevertapEntries] = splitPreEntries(
    preEntries,
    new Set(exceptionStoreIds.flat()),
  );

  // clevertapEntries.slice(0, 10).forEach((entry) => {
  //   console.error({
  //     var: entry.campaignService?.variables,
  //     vars: entry.campaignService?.messages.map((m) => m.variables),
  //   });
  // });

  connectlyEntries.slice(0, 10).forEach((entry) => {
    console.error({
      var: entry.campaignService?.variables,
      vars: entry.campaignService?.messages.map((m) => m.variables),
    });
  });

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
  preEntries: IPreEntry[],
): Promise<void> => {
  const summaryMap = preEntries
    .map(
      (preEntry) =>
        [preEntry.utm.campaignName, preEntry.campaignService] as [
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
  preEntries: IPreEntry[],
) => {
  const entries: (IConnectlyEntry | IClevertapMessage)[][] = preEntries.map(
    (preEntry) =>
      preEntry.campaignService?.integrationBody as (
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

const splitPreEntries = (
  preEntries: IPreEntry[],
  exceptionStoreIds: Set<number>,
) => {
  return preEntries
    .filter((preEntry) => !exceptionStoreIds.has(preEntry.storeId))
    .reduce(
      (acc, preEntry) => {
        if (preEntry.campaignService instanceof ConnectlyCampaignProvider) {
          acc[0].push(preEntry);
        } else if (
          preEntry.campaignService instanceof ClevertapCampaignProvider
        ) {
          acc[1].push(preEntry);
        }
        return acc;
      },
      [[], []] as [IPreEntry[], IPreEntry[]],
    );
};

const generatePreEntries = (
  storesMap: Map<number, IStoreRecomendation>,
): IPreEntry[] => {
  const entries: IPreEntry[] = [];
  for (const data of Array.from(storesMap.values())) {
    const {
      store,
      campaign,
      skus,
      utm: coreUtm,
      params: { communicationChannel: channel },
    } = data;

    const {
      variables,
      storeReferenceIds,
    }: {
      variables?: TypeCampaignVariables;
      storeReferenceIds?: number[];
    } = generateVariablesAndStoreReferenceIds(campaign.variables, {
      store,
      skus,
    }) ?? {
      variables: undefined,
      storeReferenceIds: undefined,
    };

    if (!variables || !storeReferenceIds) continue;

    campaign.paths.forEach((path) => {
      variables[path] = path;
    });

    const campaignService = CampaignFactory.createCampaignService(
      channel,
      store,
      campaign.name,
      variables,
      coreUtm,
      'es',
    );

    const utmCallToActions = generateCallToActionPaths(
      campaignService.messages,
      campaign.paths,
      store.storeId,
      storeReferenceIds,
    );

    if (!utmCallToActions) continue;

    // console.error(callToActions)

    const utmCallToAction = generateCallToAction(
      coreUtm,
      store.storeId,
      storeReferenceIds,
    );

    entries.push({
      storeId: store.storeId,
      campaignService,
      connectlyEntry: undefined,
      clevertapEntry: undefined,
      utm: coreUtm,
      utmCallToAction,
      utmCallToActions,
    });
  }
  // console.error(JSON.stringify(entries, null, 2));
  return entries;
};

const generateCallToActionPaths = (
  messageServices: MessageProvider[],
  paths: string[],
  storeId: number,
  storeReferenceIds: number[],
): IUtmCallToAction[] | null => {
  const pathObj = [];
  for (const path of paths.filter((e) => e.startsWith('path'))) {
    const [, index]: string[] = path.split('_');
    if (!path) return null;
    let callToAction: Partial<ICallToAction> = {};
    let utm: IUtm | undefined = undefined;
    if (index && index !== 'dsct') {
      if (isNaN(Number(index))) {
        // path_n
        callToAction = {
          actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
          storeReferenceIds: storeReferenceIds,
        };
        utm = messageServices[0]?.utm;
      } else {
        const i = Number(index) - 1;
        callToAction = {
          actionTypeId: Config.lbApiOperaciones.callToAction.reference,
          storeReferenceId: storeReferenceIds[i],
        };
        utm = messageServices[i]?.utm ?? messageServices[0]?.utm;
      }
    } else {
      callToAction = {
        actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
      };
      utm = messageServices[0]?.utm;
    }
    pathObj.push({
      storeId,
      utm: { ...utm, campaignContent: uuid() },
      callToAction,
    });
  }

  return pathObj.length ? pathObj : null;
};

const generateVariablesAndStoreReferenceIds = (
  variablesList: string[],
  obj: {
    store: TypeStore;
    skus: TypeSku[];
  },
): {
  variables: TypeCampaignVariables;
  storeReferenceIds: number[];
} | null => {
  const typeMap: { [k: string]: string } = {
    name: 'store',
    sgmt: 'store',
    sku: 'skus',
    dsct: 'skus',
    img: 'skus',
    // prc: 'skus',
  };
  const subTypeMap: { [k: string]: string } = {
    name: 'name',
    sgmt: 'storeStatus',
    sku: 'reference',
    dsct: 'discountFormatted',
    img: 'image',
  };
  const storeReferenceIds = [];
  let variables: TypeCampaignVariables = {};
  for (const variable of variablesList) {
    const [varName, varIndex] = variable.split('_');
    const property = (obj as { [k: string]: TypeStore | TypeSku[] })[
      typeMap[varName]
    ];

    if (!property) {
      variables = { ...variables, [variable]: `Variable[${variable}]` };
    } else if (varIndex) {
      const resp = getVariableFromSku(
        variable,
        property as TypeSku[],
        Number(varIndex) - 1,
        subTypeMap[varName],
      );

      if (!resp) return null;

      variables = { ...variables, ...resp.variable };
      if (varName.startsWith('sku')) {
        storeReferenceIds.push(resp.storeReferenceId ?? 0);
      }
    } else {
      const resp = getVariableFromStore(
        variable,
        property as TypeStore,
        subTypeMap[varName],
      );

      if (!resp) return null;

      variables = { ...variables, ...resp };
    }
  }
  return { variables, storeReferenceIds };
};

const getVariableFromStore = (
  variable: string,
  store: TypeStore,
  varName: string = '-',
): TypeCampaignVariables => {
  const value =
    (store as TypeCampaignVariables)[varName || '-'] ?? `Store[${variable}]`;
  return {
    [variable]: UTILS.removeExtraSpaces(value) || 'Visitante',
  };
};

const getVariableFromSku = (
  variable: string,
  skus: TypeSku[],
  index: number,
  varName: string = '_',
): {
  variable: TypeCampaignVariables;
  storeReferenceId: number;
} | null => {
  if (isNaN(index) || index < 0) return null;

  if (!Array.isArray(skus)) return null;

  if (index >= skus.length) return null;

  const sku = skus[index];
  const value =
    (sku as { [k: string]: string | number })[varName] ?? `Sku[${variable}]`;

  return {
    variable: {
      [variable]: UTILS.removeExtraSpaces(value),
    },
    storeReferenceId: sku.storeReferenceId,
  };
};

const generateCallToAction = (
  utm: IUtm,
  storeId: number,
  storeReferenceIds: number[],
): IUtmCallToAction => {
  let callToAction: Partial<ICallToAction> = {};
  if (storeReferenceIds.length === 1) {
    callToAction = {
      actionTypeId: Config.lbApiOperaciones.callToAction.reference,
      storeReferenceId: storeReferenceIds[0],
    };
  } else if (storeReferenceIds.length > 1) {
    // 2 or more skus then C2A_OFFER_LIST
    callToAction = {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList, // TO DO: When new section is created
      storeReferenceIds: undefined,
      // storeReferenceIds: storeReferenceIds,
    };
  } else {
    // NO Sku included
    callToAction = {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
    };
  }
  return {
    callToAction,
    storeId,
    utm,
    // campaignService: CampaignFactory.createCampaignService(channel, 'es', utm),
  };
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
