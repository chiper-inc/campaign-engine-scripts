import { v4 as uuid } from 'uuid';
import parseMobile from 'libphonenumber-js/mobile';

// Constants

import * as UTILS from './utils/index.ts';
import { Config } from './config.ts';
import {
  // campaignsBySatatus,
  getLocationStatusRangeKey,
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
  connectlyCampaignMap,
  getConnectlyCampaignKey,
} from './parameters.ts';
import { BASE_DATE, CHANNEL_PROVIDER, CITY_NAME } from './constants.ts';
import { LbApiOperacionesIntegration } from './integrations/lb-api-operaciones.ts';
import { StoreReferenceMap } from './mocks/store-reference.mock.ts';
import {
  ICallToAction,
  IConnectlyEntry,
  IClevertapMessage,
  IUtm,
} from './integrations/interfaces.ts';
import { CHANNEL, LOCATION, STORE_STATUS, STORE_VALUE } from './enums.ts';
import {
  TypeCampaignEntry,
  TypeSku,
  TypeStore,
  TypeCampaignVariables,
} from './types.ts';
import { BigQueryRepository } from './repositories/big-query.ts';
import { IStoreSuggestion } from './repositories/interfaces.ts';
import { SlackIntegration } from './integrations/slack.ts';
import { CampaignFactory } from './services/campaign.factory.ts';
import { CampaignService } from './services/campaign.service.ts';
import { MessageService } from './services/message.service.ts';
import { ConnectlyCampaignService } from './services/connectly.campaign.service.ts';
import { ClevertapCampaignService } from './services/clevertap.campaign.service.ts';

export interface IPreEntry {
  connectlyEntry: IConnectlyEntry | undefined;
  clevertapEntry: IClevertapMessage | undefined;
  campaignService?: CampaignService;
  utm: IUtm;
  utmCallToAction: IUtmCallToAction;
  utmCallToActions: IUtmCallToAction[];
  shortLink?: ICallToActionLink;
  shortLinks?: ICallToActionLink[];
}

export interface IUtmCallToAction {
  callToAction: Partial<ICallToAction>;
  utm: IUtm;
}
export interface ICallToActionLink {
  fullUrl: string;
  shortenUrl: string;
}

export interface IStoreRecomendation {
  store: TypeStore;
  communicationChannel: CHANNEL;
  campaign: TypeCampaignEntry;
  skus: TypeSku[];
  utm: IUtm;
}

// Process Gobal Variables

const today = new Date().setHours(0, 0, 0, 0) as unknown as Date;
const UUID = uuid();

// Main Function

async function main(
  day: number,
  limit = 100,
  offset = 0,
  includeShortlinks = false,
) {
  const data = await executeQueryBigQuery();
  const filteredData = data.filter((row) => filterData(row, frequencyMap, day));
  const otherMap = generateOtherMap(filteredData, day);
  let preEntries = generatePreEntries(otherMap).slice(offset, offset + limit);
  if (includeShortlinks) {
    preEntries = await generateCallToActionShortLinks(preEntries);
    preEntries = generatePathVariable(preEntries);
  }
  generateCampaignMessages(preEntries);
  const [connectlyEntries, clevertapEntries] = splitPreEntries(preEntries);
  await Promise.all([
    reportMessages(CHANNEL.WhatsApp, connectlyEntries, true),
    reportMessages(CHANNEL.PushNotification, clevertapEntries, false),
  ]);
  console.error(
    `Campaing ${UUID} generated for ${connectlyEntries.length} stores`,
  );
  console.error(
    `Campaing ${UUID} generated for ${clevertapEntries.length} stores`,
  );
  console.error(
    `Campaing ${UUID} send from ${offset + 1} to ${offset + limit}`,
  );
}

//Helper Functions

const getUtmAndCallToActionKey = ({
  utm,
  callToAction,
}: {
  utm: IUtm;
  callToAction: Partial<ICallToAction>;
}): string =>
  `${utm.campaignName}|${callToAction.actionTypeId ?? ''}|${
    callToAction.storeReferenceId ?? ''
  }|${(callToAction.storeReferenceIds || []).sort((a, b) => a - b).join(',')}|${
    callToAction.macroId ?? ''
  }|${callToAction.brandId ?? ''}`;

const generateCallToActionShortLinks = async (preEntries: IPreEntry[]) => {
  const preMap: Map<string, IUtmCallToAction> = preEntries.reduce(
    (acc, preEntry) => {
      const { utmCallToActions } = preEntry;
      for (const utmCallToAction of utmCallToActions) {
        const key = getUtmAndCallToActionKey(utmCallToAction);
        acc.set(key, utmCallToAction);
      }
      return acc;
    },
    new Map(),
  );

  // console.error('Short Links:', preMap);

  const shortLinkMap = new Map();
  for (const [key, value] of (await createShortLinks(preMap)).entries()) {
    shortLinkMap.set(key, value);
  }
  return preEntries.map((preEntry) => {
    const { utmCallToAction, utmCallToActions } = preEntry;
    return {
      ...preEntry,
      shortLink: shortLinkMap.get(getUtmAndCallToActionKey(utmCallToAction)),
      shortLinks: utmCallToActions.map((utmCallToAction) =>
        shortLinkMap.get(getUtmAndCallToActionKey(utmCallToAction)),
      ),
    };
  });
};

const createShortLinks = async (
  preMap: Map<string, IUtmCallToAction>,
): Promise<Map<string, ICallToActionLink>> => {
  const integration = new LbApiOperacionesIntegration();
  const responses = await integration.createAllShortLink(
    Array.from(preMap.entries()).map(([key, value]) => ({
      key,
      value: {
        utm: value.utm,
        callToAction: value.callToAction,
      },
    })),
  );
  return responses.reduce((acc, obj) => {
    const { key, response, campaignService } = obj as {
      key: string;
      response: { data?: { shortLink?: string } };
      campaignService: CampaignService;
    };
    const data = (response?.data ?? { utm: {} }) as {
      utm: { websiteURL?: string; shortenURL?: string };
    }; // TODO include the interface for LB-API response
    acc.set(key, {
      fullUrl: data?.utm?.websiteURL ?? '',
      shortenUrl: data.utm.shortenURL ?? '',
      campaignService,
    });
    return acc;
  }, new Map());
};

const generatePathVariable = (preEntries: IPreEntry[]) => {
  return preEntries.map((preEntry) => {
    const { campaignService, shortLinks = [] } = preEntry;
    campaignService?.setPathVariables(shortLinks);
    return preEntry;
  });
};

const generateCampaignMessages = (preEntries: IPreEntry[]) => {
  preEntries.forEach((preEntry) => {
    preEntry.campaignService?.setMessagesVariables();
  });
};

const reportMessages = async (
  channel: CHANNEL,
  preEntries: IPreEntry[],
  includeMessageNumber: boolean,
): Promise<(IClevertapMessage | IConnectlyEntry)[]> => {
  const summaryMap = preEntries
    .map((preEntry) => preEntry.utm.campaignName)
    .reduce(
      (acc, name) => {
        const [cityId, , , , , , status, campaingName] = name.split('_');
        const message = includeMessageNumber
          ? campaingName.split('-')[2]
          : 'Random';

        let key = `${CITY_NAME[cityId]}|${status}|${message}`;
        let value = acc.locationSegmentMessageMap.get(key) || 0;
        acc.locationSegmentMessageMap.set(key, value + 1);

        key = campaingName.replace(/[^a-zA-Z0-9.]/g, '_');
        value = acc.messageMap.get(key) || 0;
        acc.messageMap.set(key, value + 1);
        return acc;
      },
      {
        locationSegmentMessageMap: new Map(),
        messageMap: new Map(),
      },
    );

  const summaryMessage = Array.from(summaryMap.messageMap.entries())
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
    channel, summaryLocationSegmentMessage,
  );
  await slackIntegration.generateSendoutMessageReports(channel, summaryMessage);

  console.error('Summary Per Campaign');

  const entries: (IConnectlyEntry | IClevertapMessage)[] = preEntries
    .map(
      (preEntry) =>
        preEntry.campaignService?.integrationBody as (IConnectlyEntry | IClevertapMessage)[],
    )
    .flat();
  console.log(JSON.stringify(entries, null, 2));
  console.log('===================');
  return entries;
};

const splitPreEntries = (preEntries: IPreEntry[]) => {
  return preEntries.reduce(
    (acc, preEntry) => {
      if (preEntry.campaignService instanceof ConnectlyCampaignService) {
        acc[0].push(preEntry);
      } else if (preEntry.campaignService instanceof ClevertapCampaignService) {
        acc[1].push(preEntry);
      }
      return acc;
    },
    [[], []] as [IPreEntry[], IPreEntry[]],
  );
};

const generateOtherMap = (filteredData: IStoreSuggestion[], day: number) => {
  return filteredData.reduce((acc, row) => {
    const a = acc.get(row.storeId) || {
      storeStatus: row.storeStatus,
      city: row.city,
      utm: undefined,
      communicationChannel: row.communicationChannel,
      campaign: getCampaignRange(
        row.communicationChannel,
        row.storeStatus,
        day,
        row.storeValue,
        row.from,
        row.to,
      ),
      store: getStore(row),
      skus: [],
    };
    if (a.campaign) {
      if (!a.skus.length) {
        a.utm = getUtm(
          day,
          row.storeStatus,
          row.locationId,
          a.campaign.name,
          row.communicationChannel,
          row.rangeName,
          row.storeValue,
        );
      }
      a.skus.push(getSku(row));
      acc.set(row.storeId, a);
    }
    return acc;
  }, new Map());
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
      communicationChannel: channel,
    } = data;

    const {
      variables,
      storeReferenceIds,
    }: {
      variables: TypeCampaignVariables | undefined;
      storeReferenceIds: number[] | undefined;
    } = generateVariablesAndStoreReferenceIds(campaign.variables, {
      store,
      skus,
    }) ?? {
      variables: undefined,
      storeReferenceIds: undefined,
    };

    if (!variables || !storeReferenceIds) continue;

    const client = `+${store.phone}`;

    if (!parseMobile(client)) {
      console.error(
        `Invalid phone number: ${client} for store ${store.storeId} on campaign ${campaign.name}`,
      );
      continue;
    }

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
      channel,
      campaign.paths,
      storeReferenceIds,
    );

    if (!utmCallToActions) continue;

    // console.error(callToActions)

    const utmCallToAction = generateCallToAction(
      coreUtm,
      channel,
      storeReferenceIds,
    );

    entries.push({
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
  messageServices: MessageService[],
  channel: CHANNEL,
  paths: string[],
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
        utm = messageServices[i]?.utm;
      }
    } else {
      callToAction = {
        actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
      };
      utm = messageServices[0]?.utm;
    }
    pathObj.push({
      utm,
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
    sku: 'skus',
    dsct: 'skus',
    img: 'skus',
    // prc: 'skus',
  };
  const subTypeMap: { [k: string]: string } = {
    name: 'name',
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
  varName: string = '_',
): TypeCampaignVariables => {
  const value =
    (store as TypeCampaignVariables)[varName ?? '-'] ?? `Store[${variable}]`;
  return {
    [variable]: UTILS.removeExtraSpaces(value),
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
  channel: CHANNEL,
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
    utm,
    // campaignService: CampaignFactory.createCampaignService(channel, 'es', utm),
  };
};

const getStore = (row: IStoreSuggestion): TypeStore => ({
  storeId: row.storeId,
  name: row.name,
  phone: row.phone,
});

const getSku = (row: IStoreSuggestion): TypeSku => ({
  storeReferenceId: row.storeReferenceId,
  reference: row.reference,
  discountFormatted: row.discountFormatted,
  image: StoreReferenceMap.get(row.storeReferenceId)?.regular ?? '',
});

const getCampaignRange = (
  communicationChannel: CHANNEL,
  storeStatus: STORE_STATUS,
  day: number,
  storeValue: STORE_VALUE | null,
  from?: number | null,
  to?: number | null,
): TypeCampaignEntry | null => {
  const campaigns = connectlyCampaignMap.get(
    getConnectlyCampaignKey({
      communicationChannel,
      storeStatus,
      from,
      to,
      storeValue: storeValue ?? undefined,
    }),
  );
  if (campaigns) {
    const campaign = campaigns[day % campaigns.length];
    return {
      name: campaign.name,
      variables: campaign.variables,
      paths: campaign.paths,
    };
  }
  return null;
};

const getUtm = (
  day: number,
  storeStatus: STORE_STATUS,
  locationId: LOCATION,
  name: string,
  communicationChannel: CHANNEL,
  rangeName: string | null,
  storeValue: string | null,
) => {
  const channelMap: { [k in CHANNEL]: string } = {
    [CHANNEL.WhatsApp]: 'WA',
    [CHANNEL.PushNotification]: 'PN',
  };
  const asset = channelMap[communicationChannel] ?? 'XX';
  const payer = '1'; // Fix value
  const type = 'ot';

  let segment = storeStatus as string;
  if (rangeName) {
    segment = `${segment}.${rangeName}`;
  }

  if (storeValue) {
    segment = `${segment}.${storeValue}`;
  }

  const date = new Date(BASE_DATE + day * 24 * 60 * 60 * 1000);
  const term = UTILS.formatDDMMYY(date); // DDMMYY
  const campaign = `${UTILS.getCityId(locationId)}_${UTILS.getCPG(locationId)}_${
    asset
  }_${payer}_${UTILS.formatMMMDD(term)}_${type}_${segment}_${name.replace(
    /[^a-zA-Z0-9.]/g,
    '-',
  )}`;
  const source =
    `${CHANNEL_PROVIDER[communicationChannel]}-campaign`.toLowerCase();
  const content = UUID; // uuid
  const medium = '164';
  return {
    campaignName: campaign,
    campaignContent: content,
    campaignTerm: term,
    campaignSource: source,
    campaignMedium: medium,
  };
};

function getFrequency(
  row: IStoreSuggestion,
  frequencyMap: Map<string, number>,
): number {
  const key = getLocationStatusRangeKey({
    storeStatus: row.storeStatus,
    locationId: row.locationId,
    from: row.from,
    to: row.to,
  });
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

// Utility Functions

// const daysFromBaseDate = (date: Date): number =>
//   Math.trunc(((date as unknown as number) - BASE_DATE) / (1000 * 60 * 60 * 24));

// const formatMMMDD = (ddmmyy: string): string => {
//   const mpnth = ddmmyy.slice(2, 4);
//   const day = ddmmyy.slice(0, 2);
//   const months = [
//     '_',
//     'Ene',
//     'Feb',
//     'Mar',
//     'Abr',
//     'May',
//     'Jun',
//     'Jul',
//     'Ago',
//     'Sep',
//     'Oct',
//     'Nov',
//     'Dic',
//   ];
//   return `${months[Number(mpnth)]}${day}`;
// };

// const formatDDMMYY = (date: Date): string =>
//   date
//     .toLocaleDateString('es-US', {
//       day: '2-digit',
//       month: '2-digit',
//       year: '2-digit',
//     })
//     .replace(/\//g, '');

// const getCityId = (locationId: LOCATION) => CITY[locationId] || 0;

// const getCPG = (locationId: LOCATION) => CPG[locationId] || 0;

// const removeExtraSpaces = (val: string | number): string | number =>
//   typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;

// Run Main Function

const args = process.argv;
main(
  UTILS.daysFromBaseDate(today),
  15000,
  0,
  `${args[2]}`.toLocaleLowerCase() === 'y',
)
  .then()
  .catch(console.error);
