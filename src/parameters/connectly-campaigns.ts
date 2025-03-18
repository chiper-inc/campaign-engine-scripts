import { STORE_STATUS, STORE_VALUE } from '../enums.ts';
import { IConnectlyCampaignParameter } from './interfaces.ts';

const generateParams = (params: string[], length: number) =>
  Array.from({ length }, (_, i) => params.map((p) => `${p}_${i + 1}`)).flat();

const NAME = ['name'];
const PATH = ['path'];
const SKU_DSCT = ['sku', 'dsct'];
const SKU_DSCT_IMG = ['sku', 'dsct', 'img'];

const connectlyConnectlyCampaigns = [
  { name: 'API_Churn_1_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Churn_2_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Churn_3_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Churn_4_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Churn_5_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_Churn_6_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Churn_7_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Churn_8_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Churn_9_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Churn_10_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 5)), paths: generateParams(PATH, 5)},
  { name: 'API_Churn_11_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Churn_12_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Churn_13_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },

  { name: 'API_Lead_1_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Lead_2_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Lead_3_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Lead_4_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Lead_5_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_Lead_6_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Lead_7_es_v1', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Lead_8_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Lead_9_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Lead_10_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_Lead_11_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Lead_12_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Lead_13_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },

  { name: 'API_New_1_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_New_2_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_New_3_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_New_4_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_New_5_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_New_6_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_New_7_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_New_8_es_v1', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_New_9_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_New_10_es_v1', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_New_11_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_New_12_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_New_13_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },

  { name: 'API_Hibernating_1_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Hibernating_2_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Hibernating_3_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Hibernating_4_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Hibernating_5_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_Hibernating_6_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Hibernating_7_es_v1', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Hibernating_8_es_v2', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Hibernating_9_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Hibernating_10_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_Hibernating_11_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Hibernating_12_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Hibernating_13_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },

  { name: 'API_Retained_1_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Retained_2_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Retained_3_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Retained_4_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Retained_5_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 5)), paths: generateParams(PATH, 4) },
  { name: 'API_Retained_6_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Retained_7_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Retained_8_es_v1', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },
  { name: 'API_Retained_9_es_v1', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Retained_10_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 5)), paths: generateParams(PATH, 5) },
  { name: 'API_Retained_11_es_v0', variables: NAME.concat(generateParams(SKU_DSCT, 1)), paths: generateParams(PATH, 1) },
  { name: 'API_Retained_12_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 2)), paths: generateParams(PATH, 2) },
  { name: 'API_Retained_13_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 3)), paths: generateParams(PATH, 3) },

  { name: 'API_Churn.90-119_14_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Churn.120-149_14_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Churn.150-179_14_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
  { name: 'API_Churn.180-209_14_es_v0', variables: NAME.concat(generateParams(SKU_DSCT_IMG, 4)), paths: generateParams(PATH, 4) },
];

const getSubSegment = (
  subsegment: string,
): {
  storeValue?: STORE_VALUE;
  from?: number | null;
  to?: number | null;
} => {
  if (!subsegment) return {};

  if (subsegment.indexOf('-') === -1) {
    return { storeValue: subsegment as STORE_VALUE };
  }

  const [from, to] = subsegment.split('-');
  return {
    from: isNaN(Number(from)) ? null : Number(from),
    to: isNaN(Number(to)) ? null : Number(to),
  };
};

const connectlyCampaignList: IConnectlyCampaignParameter[] =
  connectlyConnectlyCampaigns.map((campaign) => {
    const [, fullSegment] = campaign.name.split('_');
    const [segment, subsegment] = fullSegment.split('.');
    return {
      name: campaign.name,
      storeStatus: segment as STORE_STATUS,
      variables: campaign.variables.sort((a, b) => a.localeCompare(b)),
      paths: campaign.paths.sort((a, b) => a.localeCompare(b)),
      ...getSubSegment(subsegment),
    };
  });

export const getConnectlyCampaignKey = (
  campaign: Partial<IConnectlyCampaignParameter>,
): string =>
  `${campaign.storeStatus}|${campaign.storeValue ?? ''}|${campaign.from ?? ''}|${campaign.to ?? ''}`;

export const connectlyCampaignMap = connectlyCampaignList.reduce(
  (acc, campaign) => {
    const key = getConnectlyCampaignKey(campaign);
    const current = acc.get(key) || [];
    acc.set(key, current.concat(campaign));
    return acc;
  },
  new Map<string, IConnectlyCampaignParameter[]>(),
);
