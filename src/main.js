import { BigQuery } from '@google-cloud/bigquery';
import { v4 as uuid } from 'uuid';
import { Config } from './config.js';
import parseMobile from 'libphonenumber-js/mobile'

// Constants 

const LOCATION = {
  BOG: 2,
  MDE: 7,
  CLO: 2,
  BAQ: 18,
  CMX: 11,
  SCL: 22,
  SAO: 21,
  VLN: 24,
};

// Main Input values

const frequencyByStatus = {
  Churn: {
    _default: 0,
    [LOCATION.BAQ]: 0, // 4,
    [LOCATION.BOG]: 0, // 2,
    [LOCATION.CLO]: 0, // 3,
    [LOCATION.CMX]: 0, // 4,
    [LOCATION.MDE]: 0, // 4,
    [LOCATION.VLN]: 0, // 4,
  },
  Hibernating: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 4,
    [LOCATION.MDE]: 2,
    [LOCATION.VLN]: 2,
  },
  Lead: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 8,
    [LOCATION.MDE]: 2,
    [LOCATION.VLN]: 2,
  },
  New: {
    _default: 0,
  },
  Resurrected: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 4,
    [LOCATION.MDE]: 2,
    [LOCATION.SCL]: 2,
    [LOCATION.VLN]: 2,
  },
  Retained: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 4,
    [LOCATION.MDE]: 2,
    [LOCATION.VLN]: 2,
  },
  _default: 2,
};

const NAME = ["name"];
const NAME_1SKU = ["name", "sku_1", "dsct_1"];
const NAME_2SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2"];
const NAME_3SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2", "sku_3", "dsct_3"];
const NAME_4SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2", "sku_3", "dsct_3", "sku_4", "dsct_4"];
const NAME_5SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2", "sku_3", "dsct_3", "sku_4", "dsct_4", "sku_5", "dsct_5"];

const campaignsBySatatus = {
  Churn: {
    names: [
      "API_Churn_1_es_v0",
      "API_Churn_2_es_v0",
      "API_Churn_3_es_v0",
      "API_Churn_4_es_v0",
      "API_Churn_5_es_v0",
      "API_Churn_6_es_v0",
      "API_Churn_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Churn_1_es_v0: NAME_1SKU,
      API_Churn_2_es_v0: NAME_2SKU,
      API_Churn_3_es_v0: NAME_3SKU,
      API_Churn_4_es_v0: NAME_4SKU,
      API_Churn_5_es_v0: NAME_5SKU,
    }
  },
  Lead: {
    names: [
      "API_Lead_1_es_v0",
      "API_Lead_2_es_v0",
      "API_Lead_3_es_v0",
      "API_Lead_4_es_v0",
      "API_Lead_5_es_v0",
      "API_Lead_6_es_v0",
      "API_Lead_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Lead_1_es_v0: NAME_1SKU,
      API_Lead_2_es_v0: NAME_2SKU,
      API_Lead_3_es_v0: NAME_3SKU,
      API_Lead_4_es_v0: NAME_4SKU,
      API_Lead_5_es_v0: NAME_5SKU,
    }
  },
  New: {
    names: [
      "API_New_1_es_v0",
      "API_New_2_es_v0",
      "API_New_3_es_v0",
      "API_New_4_es_v0",
      "API_New_5_es_v0",
      "API_New_6_es_v0",
      "API_New_7_es_v0",
    ],
  },
  Hibernating: {
    names: [
      "API_Hibernating_1_es_v0",
      "API_Hibernating_2_es_v0",
      "API_Hibernating_3_es_v0",
      "API_Hibernating_4_es_v0",
      "API_Hibernating_5_es_v0",
      "API_Hibernating_6_es_v0",
      "API_Hibernating_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Hibernating_1_es_v0: NAME_1SKU,
      API_Hibernating_2_es_v0: NAME_2SKU,
      API_Hibernating_3_es_v0: NAME_3SKU,
      API_Hibernating_4_es_v0: NAME_4SKU,
      API_Hibernating_5_es_v0: NAME_5SKU,
    }

  },
  Retained: {
    names: [
      "API_Retained_1_es_v0",
      "API_Retained_2_es_v0",
      "API_Retained_3_es_v0",
      "API_Retained_4_es_v0",
      "API_Retained_5_es_v0",
      "API_Retained_6_es_v0",
      "API_Retained_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Retained_1_es_v0: NAME_1SKU,
      API_Retained_2_es_v0: NAME_2SKU,
      API_Retained_3_es_v0: NAME_3SKU,
      API_Retained_4_es_v0: NAME_4SKU,
      API_Retained_5_es_v0: NAME_5SKU,
    }

  },
  Resurrected: {
    names: [
      "API_Resurrected_1_es_v0",
      "API_Resurrected_2_es_v0",
      "API_Resurrected_3_es_v0",
      "API_Resurrected_4_es_v0",
      "API_Resurrected_5_es_v0",
      "API_Resurrected_6_es_v0",
      "API_Resurrected_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Resurrected_1_es_v0: NAME_1SKU,
      API_Resurrected_2_es_v0: NAME_2SKU,
      API_Resurrected_3_es_v0: NAME_3SKU,
      API_Resurrected_4_es_v0: NAME_4SKU,
      API_Resurrected_5_es_v0: NAME_5SKU,
    }
  },
  variables: {
    _default: NAME,
  }
}

// Process Gobal Variables

const today = new Date().setHours(0, 0, 0, 0);
const BASE_DATE = new Date('2025/03/05').setHours(0, 0, 0, 0);
const UUID = uuid();

const bigquery = new BigQuery();
const queryStores = `
    SELECT DISTINCT
      country,
      storeStatus,
      storeId,
      city,
      locationId,
      storeReferenceId,
      name,
      reference,
      discountFormatted,
      phone,
      ranking
    FROM \`chiperdw.dbt.BI_D-MessageGenerator\`
    WHERE phone IS NOT NULL
      AND ranking <= 10
      AND (
        (storeStatus = 'Churn' AND daysSinceLastOrderDelivered > 1000000) OR
        (storeStatus <> 'Churn')
      )
    ORDER BY storeId, ranking
`;

// Main Function 

// const UTM = {
//   utmSource: 'connectly-campaign',
//   utmMedium: '164',
//   utmContent: UUID,
//   utmCampaign: '1_CHIPER_WA_3_06ot_Churn',
//   utmTerm: '060325',
// }

// const callToAction = {
//   actionTypeId: 1,
//   referenceId: 3,
//   macroId,
//   brandId,
// };


async function main(day, limit = 100, offset = 0) {
  const data = await executeQueryBigQuery(queryStores);
  const filteredData = data.filter(row => filterData(row, frequencyByStatus, day));
  const storeMap = generateStoreMap(filteredData, campaignsBySatatus, day);
  let entries = generatePreEntries(storeMap).slice(offset, offset + limit);
  entries = await generateCallToActionShortLinks(entries);
  entries = generatePathVariable(entries);
  reportEntries(entries.slice(offset, offset + limit));
  // console.log('===================');
  // console.log(JSON.stringify(entries.slice(offset, offset + limit), null, 2));
  // console.log('===================');
  console.error(`Campaing ${UUID} generated for ${entries.length} stores`);
  console.error(`Campaing ${UUID} send from ${offset + 1} to ${offset + limit}`);
}

// Helper Functions

const getUtmAndCallToActionKey = ({ utm, callToAction }) => (
  `${
    utm.campaignName
  }|${
    callToAction.actionTypeId ?? ''
  }|${
    callToAction.storeReferenceId ?? ''
  }|${
    callToAction.storeReferenceIds?.join(',') ?? ''
  }|${
    callToAction.macroId ?? ''
  }|${
    callToAction.brandId ?? ''
  }`
);

const generatePathVariable = (entries) => {
  return entries.map(entry => {
    const path = getPathFromC2a(entry._c2a)
    return {
      ...entry,
      variables: {
        ...(entry?.variables || {}),
        path
      },
      _c2a: undefined
    }
  });
}

const getPathFromC2a = (c2a)=> {
  const { utm, shortLink } = c2a;
  const queryParams = 
    `utm_source=${
      utm.campaignSource || ''
    }&utm_medium=${
      utm.campaignMedium || ''
    }&utm_content=${
      utm.campaignContent || ''
    }&utm_campaign=${
      utm.campaignName
    }&utm_term=${
      utm.campaignTerm || ''
    }`;
  return `${shortLink.split('/').slice(1)}?${queryParams}`;
}

const generateCallToActionShortLinks = async (entries) => {
  const preMap = entries.reduce((acc, entry) => {
    const key = getUtmAndCallToActionKey(entry._c2a);
    acc.set(key, entry._c2a);
    return acc;
  }, new Map());
  // console.error(Array.from(preMap.keys()), preMap.size);
  const shortLinkMap = new Map();
  for (const [key, value] of preMap.entries()) {
    const response = await createshortLink(value);
    // console.log('shortLink:', response?.data);
    shortLinkMap.set(key, response?.data?.shortLink);
  }
  // console.error({ shortLinkMap });
  return entries.map(entry => ({
    ...entry,
    _c2a: {
      ...entry._c2a,
      shortLink: shortLinkMap.get(getUtmAndCallToActionKey(entry._c2a)),
    }
  }));
}

const reportEntries = (entries) => {
  console.log('===================');
  console.log(JSON.stringify(entries, null, 2));
  console.log('===================');
  const summary = entries.reduce((acc, entry) => {
    const value = acc.get(entry.campaignName) || 0;
    acc.set(entry.campaignName, value + 1);
    return acc;
  }, new Map());
  console.error('Summary Per Campaign');
  for (const [key, value] of summary.entries()) {
    console.error(`- ${key}: ${value}`);
  }
}

const generateStoreMap = (filteredData, campaignsBySatatus, day) => {
  return filteredData.reduce((acc, row) => {
    const a = acc.get(row.storeId) || {
      storeStatus: row.storeStatus, city: row.city,
      utm: undefined,
      campaign: getCamapign(row.storeStatus, day, campaignsBySatatus),
      store: getStore(row),
      skus: []
    };
    if (a.campaign) {
      if (!a.skus.length) {
        a.utm = getUtm(day, row.storeStatus, row.locationId, a.campaign.name);
      }
      a.skus.push(getSku(row));
      acc.set(row.storeId, a);
    }
    return acc;
  }, new Map());
}

const generatePreEntries = (storesMap) => {
  const entries = [];
  for (const data of Array.from(storesMap.values())) {
    const { store, campaign, skus, utm } = data;

    const { variables, storeReferenceIds } = generateVariablesAndStoreReferenceIds(
      campaign.variables, { store, skus }, utm
    ) || {};

    if (!variables) continue;

    const client = `+${store.phone}`;

    if (!parseMobile(client)) {
      console.error(`Invalid phone number: ${client} for store ${store.storeId} on campaign ${campaign.name}`);
      continue;
    }

    const callToAction = generateCallToAction(storeReferenceIds);

    entries.push({
      client: `+${store.phone}`,
      campaignName: campaign.name.replace(/_/g,' ').toLowerCase(),
      variables,
      _c2a: { utm, callToAction },
    });
  }
  return entries;
}

const removeExtraSpaces = (str) => str.replace(/\s+/g, ' ').trim();

const generateVariablesAndStoreReferenceIds = (variablesList, obj, utm) => {
  const typeMap = {
    'name': 'store',
    'sku': 'skus',
    'dsct': 'skus',
    // prc: 'skus',
  }
  const subTypeMap = {
    'name': 'name',
    'sku': 'reference',
    'dsct': 'discountFormatted', 
  }
  const storeReferenceIds = [];
  const variables = {
    path: 'k2Qh'
    // path: `pedir/seccion/descuentos?${utm}`,
  };
  for (const variable of variablesList) {
    const [varName, varIndex] = variable.split('_');
    const property = obj[typeMap[varName] || '_'];

    if (!property) {
      variables[variable] = variable;
    } else if (varIndex) {
      const index = Number(varIndex) - 1;
      if (index >= property.length) return null;

      variables[variable] = property[index]?.[subTypeMap[varName]] || variable;
      if (varName.startsWith('sku')) {
        storeReferenceIds.push(property[index]?.storeReferenceId || 0);
      }
    } else {
      const value = property[subTypeMap[varName]] || variable; 
      variables[variable] = value;
    }
    variables[variable] = removeExtraSpaces(variables[variable]);
  }
  return { variables, storeReferenceIds };;
}

const generateCallToAction = (storeReferenceIds) => {
  if (storeReferenceIds.length === 1) {
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.reference,
      storeReferenceId: storeReferenceIds[0],
    }
  } else if (storeReferenceIds.length > 1) { // 2 or more skus then C2A_OFFER_LIST
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList, // TO DO: When new section is created
      storeReferenceIds: undefined,
      // storeReferenceIds: storeReferenceIds,
    }
  } else { // NO Sku included
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
    }
  }
}

const getStore = (row) => ({
  storeId: row.storeId, 
  name: row.name,
  phone: row.phone,
});

const getSku = (row) => ({
  storeReferenceId: row.storeReferenceId,
  reference: row.reference, 
  discountFormatted: row.discountFormatted
});

const getCamapign = (status, day, campaignsBySatatus) => {
  const campaigns = campaignsBySatatus[status] || { names: [] };
  if (campaigns.names.length) {
    const name = campaigns.names[day % campaigns.names.length];
    const variables = campaigns.variables?.[name] || campaigns.variables?._default || campaignsBySatatus.variables?._default;
    return {
      name,
      variables,
    } 
  }
  return null;
}

const getUtm = (day, status, locationId, name) => {
  const asset = 'WA';
  const payer = '3';
  const type = 'ot';

  const formatMMMDD = (ddmmyy) => {
    const mpnth = ddmmyy.slice(2, 4);
    const day = ddmmyy.slice(0, 2);
    const months = ['_', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[Number(mpnth)]}${day}`;
  };
  const formatDDMMYY = (date) => date.toLocaleDateString(
    'es-US', 
    { day: '2-digit', month: '2-digit', year: '2-digit' }
  ).replace(/\//g, '');
  const getCityId = (locationId) => {
    const city = {
      [LOCATION.BOG]: 1,
      [LOCATION.MDE]: 7,
      [LOCATION.CLO]: 2,
      [LOCATION.BAQ]: 3,
      [LOCATION.CMX]: 11,
      [LOCATION.SCL]: 21,
      [LOCATION.SAO]: 20,
      [LOCATION.VLN]: 24,
    };
    return city[locationId] || 0;
  };
  const getProvider = (locationId) => {
    const provider = {
      [LOCATION.BOG]: 1377,
      [LOCATION.MDE]: 1377,
      [LOCATION.CLO]: 1377,
      [LOCATION.BAQ]: 1377,
      [LOCATION.CMX]: 1381,
      [LOCATION.SCL]: 1379,
      [LOCATION.SAO]: 1378,
      [LOCATION.VLN]: 1380,
    };
    return provider[locationId] || 0;
  }

  const date = new Date(BASE_DATE + (day * 24 * 60 * 60 * 1000));
  const term = formatDDMMYY(date); // DDMMYY
  const campaign = `${
      getCityId(locationId)
    }_${
      getProvider(locationId)
    }_${
      asset
    }_${
      payer
    }_${
      formatMMMDD(term)
    }_${
      type
    }_${
      status
    }_${
      encodeURIComponent(name.replace(/[^a-zA-Z0-9]/g, '-'))
    }`;
  const source = 'connectly-campaign';
  const content = UUID; // uuid
  const medium = '164';
  return {
    campaignName: campaign,
    campaignContent: content,
    campaignTerm: term,
    campaignSource: source,
    campaignMedium: medium,
  };
}

const daysFromBaseDate = (date) => Math.trunc((date - BASE_DATE) / (1000 * 60 * 60 * 24));

function getModulo (status, location, filter) {
  const statusFilter = filter[status] || filter._default || {};
  return statusFilter[location] || statusFilter._default;
}

function filterData (row, filter, day) {
  const mod = getModulo(row.storeStatus, row.locationId, filter);
  if (!mod) return false;
  return (row.storeId % mod) === (day % mod);
}

async function createshortLink(payload) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': Config.lbApiOperaciones.apiKey
      ? Config.lbApiOperaciones.apiKey
      : `Bearer ${Config.lbApiOperaciones.apiToken}`, // Replace with a real token if needed
  };
  const url = `${Config.lbApiOperaciones.apiUrl}/operational/create-external-action`;
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(response => {
    if (response.status !== 200) {
      throw new Error(`Error creating shortLink: ${response.status}: ${response.statusText}`);
    }
    return response.json()
  }).catch((error) => {
    console.error('ERROR:', error);
    throw error;
  });
}



async function executeQueryBigQuery(query) {
  const options = {
    query,
    location: 'US',
  };

  try {
    const [job] = await bigquery.createQueryJob(options);
    console.error(`Job ${job.id} started.`);

    const [rows] = await job.getQueryResults();
    console.error(`Job ${job.id} Results: ${rows.length}`);
    return rows;
  } catch (error) {
    console.error('ERROR:', error);
    throw error;
  }
}

// Run Main Function

main(daysFromBaseDate(today), 11000, 0);

