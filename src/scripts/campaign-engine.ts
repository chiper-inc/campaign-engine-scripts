import { v4 as uuid } from 'uuid';

// Constants

import * as UTILS from '../utils/index.ts';
import * as CLEVERATAP from '../mocks/clevertap-campaigns.mock.ts';
import { Config } from '../config.ts';
import {
  // campaignsBySatatus,
  getLocationStatusRangeKey,
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
  campaignMap,
  getCampaignKey,
} from '../parameters.ts';
import { BASE_DATE, CHANNEL_PROVIDER, CITY_NAME } from '../constants.ts';
import { LbApiOperacionesIntegration } from '../integrations/lb-api-operaciones.ts';
import { StoreReferenceMap } from '../mocks/store-reference.mock.ts';
import {
  ICallToAction,
  IConnectlyEntry,
  IClevertapMessage,
  IUtm,
  ICallToActionLink,
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
import { getCampaignSegmentName } from '../parameters/campaigns.ts';

export interface IPreEntry {
  connectlyEntry: IConnectlyEntry | undefined;
  clevertapEntry: IClevertapMessage | undefined;
  campaignService?: CampaignProvider;
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
  const data = await executeQueryBigQuery();
  const filteredData = data.filter((row) => filterData(row, frequencyMap, day));
  let storeMap = generateStoreAndSkuMap(filteredData);
  storeMap = assignCampaignAndUtm(storeMap, day);
  let preEntries = generatePreEntries(storeMap).slice(offset, offset + limit);
  if (includeShortlinks) {
    preEntries = await generateCallToActionShortLinks(preEntries);
    preEntries = generatePathVariable(preEntries);
  }
  await generateCampaignMessages(preEntries);
  const [connectlyEntries, clevertapEntries] = splitPreEntries(preEntries);
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
      campaignService: CampaignProvider;
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

const generateCampaignMessages = async (preEntries: IPreEntry[]) => {
  let i = 0;
  const BATCH_SIZE = Config.google.vertexAI.bacthSize;
  const n = Math.ceil(preEntries.length / BATCH_SIZE);
  const promises: Promise<unknown>[] = [];
  console.error(
    `Start Generating AI Messages ${preEntries.length} in ${n} batches of ${BATCH_SIZE}`,
  );
  for (const preEntry of preEntries) {
    if (promises.length >= BATCH_SIZE) {
      await Promise.all(promises);
      console.error(`batch ${++i} of ${n}, for GenAI done!`);
      promises.length = 0;
    }
    promises.push(
      preEntry.campaignService
        ? preEntry.campaignService.setMessagesVariables()
        : Promise.resolve(),
    );
  }
  if (promises.length) {
    await Promise.all(promises);
    console.error(`batch ${++i} of ${n}, for GenAI done`);
  }
  console.error('End Generating AI Messages');
};

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
  if (sendToConnectly) {
    await connectlyIntegration.sendAllEntries(connectlyEntries.flat());
  }
  if (sendToClevertap) {
    await clevertapIntegration.sendAllCampaigns(clevertapEntries);
  }
};

const splitPreEntries = (preEntries: IPreEntry[]) => {
  return preEntries.reduce(
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

const generateStoreAndSkuMap = (
  filteredData: IStoreSuggestion[],
): Map<number, IStoreRecomendation> => {
  return filteredData.reduce((acc, row) => {
    const params: TypeStoreParams = {
      locationId: row.locationId,
      communicationChannel: row.communicationChannel,
      storeStatus: row.storeStatus,
      storeValue: row.storeValue,
      city: row.city,
      from: row.from ?? null,
      to: row.to ?? null,
    };
    const a = acc.get(row.storeId) || {
      params,
      store: getStore(row),
      skus: [],
    };
    a.skus.push(getSku(row));
    acc.set(row.storeId, a);
    return acc;
  }, new Map());
};

const assignCampaignAndUtm = (
  storeMap: Map<number, IStoreRecomendation>,
  day: number,
): Map<number, IStoreRecomendation> => {
  const newStoreMap = new Map();
  for (const [storeId, storeRecomendation] of storeMap.entries()) {
    const { params, skus } = storeRecomendation;
    const campaign = getCampaignRange(params, day, skus.length);

    if (!campaign) continue;

    const utm = getUtm(params, day);
    newStoreMap.set(storeId, {
      ...storeRecomendation,
      campaign,
      utm,
    });
  }
  return newStoreMap;
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
  messageServices: MessageProvider[],
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
        utm = messageServices[i]?.utm ?? messageServices[0]?.utm;
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
  { communicationChannel, locationId }: TypeStoreParams,
  day: number,
  numberOfAvailableSkus: number,
): TypeCampaignEntry | null => {
  const generateArray = (n: number): number[] => {
    const arr = [];
    for (let i = 1; i <= n; i++) {
      arr.push(i);
    }
    return arr;
  };

  const adjustToMessageConstraint = (channel: CHANNEL, n: number): number => {
    const MESSAGE_CONSTRAINT = {
      [CHANNEL.WhatsApp]: [2, 4],
      [CHANNEL.PushNotification]: generateArray(
        CLEVERATAP.maxMessagesPerCampaign,
      ),
    };
    const options = MESSAGE_CONSTRAINT[channel] ?? [];
    if (!options.length) return 0;

    const min = Math.min(...options);
    const max = Math.max(...options);

    if (n < min) return 0; // No hay productos suficientes
    if (n > max) return max; // Se toma la cantidad maxima de productos

    let resp = min;
    for (const option of options) {
      if (resp < option && option <= n) {
        resp = option;
      }
    }
    return resp;
  };

  const numberOfSkus = adjustToMessageConstraint(
    communicationChannel,
    numberOfAvailableSkus,
  );
  if (!numberOfSkus) return null;

  const campaigns = campaignMap.get(
    getCampaignKey({
      communicationChannel,
      numberOfSkus,
    }),
  );
  if (campaigns) {
    const campaign = campaigns[day % campaigns.length];

    if (!campaign) return null;
    if (
      campaign.variables.filter((v) => v.startsWith('sku')).length >
      numberOfSkus
    ) {
      console.log(
        communicationChannel,
        locationId,
        campaign.variables.filter((v) => v.startsWith('sku')),
        numberOfSkus,
      );
      return null;
    }
    return {
      name: campaign.name,
      variables: campaign.variables,
      paths: campaign.paths,
    };
  }
  return null;
};

const getUtm = (
  params: TypeStoreParams,
  day: number,
  // name: string,
  // segment: string | null,
) => {
  const channelMap: { [k in CHANNEL]: string } = {
    [CHANNEL.WhatsApp]: 'WA',
    [CHANNEL.PushNotification]: 'PN',
  };

  const segment = getCampaignSegmentName(params);
  const { communicationChannel, locationId } = params;
  const asset = channelMap[communicationChannel] ?? 'XX';
  const payer = '1'; // Fix value
  const type = 'ot';

  const date = new Date(BASE_DATE + day * 24 * 60 * 60 * 1000);
  const term = UTILS.formatDDMMYY(date); // DDMMYY
  const campaign = `${UTILS.getCityId(locationId)}_${UTILS.getCPG(locationId)}_${
    asset
  }_${payer}_${UTILS.formatMMMDD(term)}_${type}_${segment}`;
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
  .catch(console.error);
