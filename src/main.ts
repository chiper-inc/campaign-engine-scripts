import { v4 as uuid } from 'uuid';
import parseMobile from 'libphonenumber-js/mobile';

// Constants

import { Config } from './config.ts';
import {
  // campaignsBySatatus,
  getLocationStatusRangeKey,
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
  connectlyCampaignMap,
  getConnectlyCampaignKey,
} from './parameters.ts';
import { CHANNEL_PROVIDER, CITY, CITY_NAME, CPG } from './constants.ts';
import { LbApiOperacionesIntegration } from './integrations/lb-api-operaciones.ts';
import { StoreReferenceMap } from './mocks/store-reference.mock.ts';
import {
  ICallToAction,
  IConnectlyEntry,
  IClevertapEntry,
  IShortLinkPayload,
  IUtm,
} from './integrations/interfaces.ts';
import { CHANNEL, LOCATION, STORE_STATUS, STORE_VALUE } from './enums.ts';
import {
  TypeCampaignByStatus,
  TypeCampaignEntry,
  TypeCampaignStatus,
  TypeSku,
  TypeStore,
} from './types.ts';
import { TypeCampaignVariables } from './types.ts';
import { BigQueryRepository } from './repositories/big-query.ts';
import { IStoreSuggestion } from './repositories/interfaces.ts';
import { SlackIntegration } from './integrations/slack.ts';

export interface IPreEntry {
  connectlyEntry: IConnectlyEntry | undefined;
  clevertapEntry: IClevertapEntry | undefined;
  utm: IUtm;
  callToAction: Partial<ICallToAction>;
  callToActions: Partial<ICallToAction>[];
  shortLink?: ICallToActionLink;
  shortLinks?: ICallToActionLink[];
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
const BASE_DATE = new Date('2025/03/05').setHours(
  0,
  0,
  0,
  0,
) as unknown as number;
const UUID = uuid();

// Main Function

async function main(day: number, limit = 100, offset = 0) {
  const data = await executeQueryBigQuery();
  const filteredData = data.filter((row) => filterData(row, frequencyMap, day));
  // const storeMap = generateStoreMap(filteredData, campaignsBySatatus, day);
  // console.error(storeMap.size);
  const otherMap = generateOtherMap(filteredData, day);
  // console.error(otherMap);
  let preEntries = generatePreEntries(otherMap).slice(offset, offset + limit);
  preEntries = await generateCallToActionShortLinks(preEntries);
  preEntries = generatePathVariable(preEntries);
  const [connectlyEntries, clevertapEntries] = await Promise.all([
    reportConnectlyEntries(preEntries),
    reportClevertapEntries(preEntries),
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

// Helper Functions

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

const generatePathVariable = (preEntries: IPreEntry[]) => {
  return preEntries.map((preEntry) => {
    const { utm, shortLinks = [], connectlyEntry, clevertapEntry } = preEntry;

    return {
      ...preEntry,
      connectlyEntry: generateConnectlyPathVariables(
        connectlyEntry,
        utm,
        shortLinks,
      ),
      clevertapEntry: geeneratClevertapPathVariables(
        clevertapEntry,
        utm,
        shortLinks,
      ),
    };
  });
};

const generateConnectlyPathVariables = (
  connectlyEntry: IConnectlyEntry | undefined,
  utm: IUtm,
  shortLinks: ICallToActionLink[],
): IConnectlyEntry | undefined => {
  if (!connectlyEntry) return undefined;

  const pathObj: TypeCampaignVariables = {};

  const paths: string[] = [];
  for (const variable in connectlyEntry.variables) {
    if (variable.startsWith('path')) {
      paths.push(variable);
    }
  }

  paths.forEach((path, i) => {
    const shortLink = getConnectlyPathFromPreEntry({
      url:
        shortLinks[i].shortenUrl ?? `https://sl.chiper.co/shortlink_${i + 1}`,
      utm,
    });
    pathObj[path] = shortLink;
  });
  return {
    ...connectlyEntry,
    variables: { ...connectlyEntry.variables, ...pathObj },
  };
};

const geeneratClevertapPathVariables = (
  connectlyEntry: IClevertapEntry | undefined,
  utm: IUtm,
  shortLinks: ICallToActionLink[],
): IClevertapEntry | undefined => {
  if (!connectlyEntry) return undefined;

  const pathObj: TypeCampaignVariables = {};

  const paths: string[] = [];
  for (const variable in connectlyEntry.variables) {
    if (variable.startsWith('path')) {
      paths.push(variable);
    }
  }

  paths.forEach((path, i) => {
    const shortLink = getClevertapPathFromPreEntry({
      url:
        shortLinks[i].fullUrl ?? `https://tienda.chiper.co/shortlink_${i + 1}`,
      utm,
    });
    pathObj[path] = shortLink;
  });

  return {
    ...connectlyEntry,
    variables: { ...connectlyEntry.variables, ...pathObj },
  };
};

const getClevertapPathFromPreEntry = ({
  //  utm,
  url,
}: {
  utm: IUtm;
  url: string;
}) => {
  // const queryParams = `utm_source=${utm.campaignSource || ''}&utm_medium=${
  //   utm.campaignMedium || ''
  // }&utm_content=${utm.campaignContent || ''}&utm_campaign=${
  //   utm.campaignName
  // }&utm_term=${utm.campaignTerm || ''}`;
  return url;
};

const getConnectlyPathFromPreEntry = ({
  utm,
  url,
}: {
  utm: IUtm;
  url: string;
}) => {
  const queryParams = `utm_source=${utm.campaignSource || ''}&utm_medium=${
    utm.campaignMedium || ''
  }&utm_content=${utm.campaignContent || ''}&utm_campaign=${
    utm.campaignName
  }&utm_term=${utm.campaignTerm || ''}`;
  return `${url.split('/').slice(3)}?${queryParams}`; // remove protocol and hostname
};

const generateCallToActionShortLinks = async (preEntries: IPreEntry[]) => {
  const preMap = preEntries.reduce((acc, preEntry) => {
    const { utm, callToActions } = preEntry;
    for (const callToAction of callToActions) {
      const key = getUtmAndCallToActionKey({ utm, callToAction });
      acc.set(key, { utm, callToAction });
    }
    return acc;
  }, new Map());
  const shortLinkMap = new Map();
  for (const [key, value] of (await createShortLinks(preMap)).entries()) {
    shortLinkMap.set(key, value);
  }
  return preEntries.map((preEntry) => {
    const { utm, callToAction, callToActions } = preEntry;
    return {
      ...preEntry,
      shortLink: shortLinkMap.get(
        getUtmAndCallToActionKey({ utm, callToAction }),
      ),
      shortLinks: callToActions.map((callToAction) =>
        shortLinkMap.get(getUtmAndCallToActionKey({ utm, callToAction })),
      ),
    };
  });
};

const createShortLinks = async (
  preMap: Map<string, IShortLinkPayload>,
): Promise<Map<string, ICallToActionLink>> => {
  const integration = new LbApiOperacionesIntegration();
  const responses = await integration.createAllShortLink(
    Array.from(preMap.entries()).map(([key, value]) => ({
      key,
      value,
    })),
  );
  return responses.reduce((acc, obj) => {
    const { key, response } = obj as {
      key: string;
      response: { data?: { shortLink?: string } };
    };
    const data = (response?.data ?? { utm: {} }) as {
      utm: { websiteURL?: string; shortenURL?: string };
    }; // TO include the interface for LB-API response
    acc.set(key, {
      fullUrl: data?.utm?.websiteURL ?? '',
      shortenUrl: data.utm.shortenURL ?? '',
    });
    return acc;
  }, new Map());
};

const reportClevertapEntries = async (
  preEntries: IPreEntry[],
): Promise<IClevertapEntry[]> => {
  const entries: IClevertapEntry[] = preEntries
    .filter((preEntry) => preEntry.clevertapEntry)
    .map((preEntry) => preEntry.clevertapEntry as IClevertapEntry);
  console.log(JSON.stringify(entries, null, 2));
  console.log('===================');
  return entries;
};

const reportConnectlyEntries = async (
  preEntries: IPreEntry[],
): Promise<IConnectlyEntry[]> => {
  const summaryMap = preEntries
    .filter((preEntry) => preEntry.connectlyEntry)
    .map((preEntry) => preEntry.utm.campaignName)
    .reduce(
      (acc, name) => {
        const [cityId, , , , , , status, campaingName] = name.split('_');
        const [, , message] = campaingName.split('-');

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
    summaryLocationSegmentMessage,
  );
  await slackIntegration.generateSendoutMessageReports(summaryMessage);
  //    slackIntegration.generateSendoutSummaryReports(summaryMessage),
  //  ]);

  console.error('Summary Per Campaign');

  // for (const { key, value } of summaryLocationSegmentMessage) {
  //   console.error(`- ${key}: ${value}`);
  // }
  // console.log('===================');
  // for (const { key, value } of summaryMessage) {
  //   console.error(`- ${key}: ${value}`);
  // }
  const entries: IConnectlyEntry[] = preEntries
    .filter((preEntry) => preEntry.connectlyEntry)
    .map((preEntry) => preEntry.connectlyEntry as IConnectlyEntry);
  console.log(JSON.stringify(entries, null, 2));
  console.log('===================');
  return entries;
};

const generateOtherMap = (filteredData: IStoreSuggestion[], day: number) => {
  return filteredData.reduce((acc, row) => {
    const a = acc.get(row.storeId) || {
      storeStatus: row.storeStatus,
      city: row.city,
      utm: undefined,
      communicationChannel: row.communicationChannel,
      campaign: getCamapignRange(
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

// export const generateStoreMap = (
//   filteredData: IStoreSuggestion[],
//   campaignsBySatatus: TypeCampaignByStatus,
//   day: number,
// ) => {
//   return filteredData.reduce((acc, row) => {
//     const a = acc.get(row.storeId) || {
//       storeStatus: row.storeStatus,
//       city: row.city,
//       utm: undefined,
//       campaign: getCamapign(row.storeStatus, day, campaignsBySatatus),
//       store: getStore(row),
//       skus: [],
//     };
//     if (a.campaign) {
//       if (!a.skus.length) {
//         a.utm = getUtm(day, row.storeStatus, row.locationId, a.campaign.name, row.communicationChannel);
//       }
//       a.skus.push(getSku(row));
//       acc.set(row.storeId, a);
//     }
//     return acc;
//   }, new Map());
// };

const generatePreEntries = (
  storesMap: Map<number, IStoreRecomendation>,
): IPreEntry[] => {
  const generateConnectlyEntry = (
    channel: CHANNEL,
    store: TypeStore,
    campaign: string,
    variables: TypeCampaignVariables,
  ): IConnectlyEntry | undefined =>
    channel === CHANNEL.WhatsApp
      ? {
          client: `+${store.phone}`,
          campaignName: campaign.replace(/_/g, ' ').toLowerCase(),
          variables,
        }
      : undefined;

  const generateClevertapEntry = (
    channel: CHANNEL,
    store: TypeStore,
    campaign: string,
    variables: TypeCampaignVariables,
  ): IClevertapEntry | undefined =>
    channel === CHANNEL.PushNotification
      ? {
          identity: store.storeId,
          campaignId: campaign, // TODO Generate the ID for Clevertap
          variables,
        }
      : undefined;

  const entries: IPreEntry[] = [];
  for (const data of Array.from(storesMap.values())) {
    const { store, campaign, skus, utm, communicationChannel: channel } = data;

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

    const callToActions = generateCallToActionPaths(
      campaign.paths,
      storeReferenceIds,
    );

    if (!callToActions) continue;

    // console.error(callToActions)

    campaign.paths.forEach((path) => {
      variables[path] = path;
    });

    const callToAction = generateCallToAction(storeReferenceIds);

    entries.push({
      connectlyEntry: generateConnectlyEntry(
        channel,
        store,
        campaign.name,
        variables,
      ),
      clevertapEntry: generateClevertapEntry(
        channel,
        store,
        campaign.name,
        variables,
      ),
      utm,
      callToAction,
      callToActions,
    });
  }
  // console.error('Entries:', entries.length);
  return entries;
};

const generateCallToActionPaths = (
  paths: string[],
  storeReferenceIds: number[],
): Partial<ICallToAction>[] | null => {
  const pathObj = [];
  for (const path of paths.filter((e) => e.startsWith('path'))) {
    const [, index]: string[] = path.split('_');
    if (!path) return null;
    if (index) {
      if (isNaN(Number(index))) {
        // path_n
        pathObj.push({
          actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
          storeReferenceIds: storeReferenceIds,
        });
      } else {
        pathObj.push({
          actionTypeId: Config.lbApiOperaciones.callToAction.reference,
          storeReferenceId: storeReferenceIds[Number(index) - 1],
        });
      }
    } else {
      pathObj.push({
        actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
      });
    }
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
    [variable]: removeExtraSpaces(value),
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
      [variable]: removeExtraSpaces(value),
    },
    storeReferenceId: sku.storeReferenceId,
  };
};

const generateCallToAction = (
  storeReferenceIds: number[],
): Partial<ICallToAction> => {
  if (storeReferenceIds.length === 1) {
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.reference,
      storeReferenceId: storeReferenceIds[0],
    };
  } else if (storeReferenceIds.length > 1) {
    // 2 or more skus then C2A_OFFER_LIST
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList, // TO DO: When new section is created
      storeReferenceIds: undefined,
      // storeReferenceIds: storeReferenceIds,
    };
  } else {
    // NO Sku included
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
    };
  }
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

const getCamapign = (
  status: STORE_STATUS,
  day: number,
  campaignsByStatus: TypeCampaignByStatus,
): TypeCampaignEntry | null => {
  const campaigns = campaignsByStatus[status] as unknown as TypeCampaignStatus;
  if (campaigns) {
    const name = campaigns.names[day % campaigns.names.length];
    const variables =
      campaigns.variables?.[name] ??
      campaigns.variables?._default ??
      campaignsByStatus[STORE_STATUS._default].variables?._default;
    return {
      name,
      variables,
      paths: [],
    };
  }
  return null;
};

const getCamapignRange = (
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
  const term = formatDDMMYY(date); // DDMMYY
  const campaign = `${getCityId(locationId)}_${getCPG(locationId)}_${
    asset
  }_${payer}_${formatMMMDD(term)}_${type}_${segment}_${name.replace(
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
    [CHANNEL.WhatsApp /*, CHANNEL.PushNotification */],
  );
}

// Utility Functions

const daysFromBaseDate = (date: Date): number =>
  Math.trunc(((date as unknown as number) - BASE_DATE) / (1000 * 60 * 60 * 24));

const formatMMMDD = (ddmmyy: string): string => {
  const mpnth = ddmmyy.slice(2, 4);
  const day = ddmmyy.slice(0, 2);
  const months = [
    '_',
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  return `${months[Number(mpnth)]}${day}`;
};

const formatDDMMYY = (date: Date): string =>
  date
    .toLocaleDateString('es-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .replace(/\//g, '');

const getCityId = (locationId: LOCATION) => CITY[locationId] || 0;

const getCPG = (locationId: LOCATION) => CPG[locationId] || 0;

const removeExtraSpaces = (val: string | number): string | number =>
  typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;

// Run Main Function

main(daysFromBaseDate(today), 15000, 0).then().catch(console.error);
