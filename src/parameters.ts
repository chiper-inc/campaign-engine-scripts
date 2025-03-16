import { LOCATION, STORE_STATUS } from './enums.ts';
import { TypeCampaignByStatus } from './types.ts';

export interface IFrequencyParameter {
  locationId: LOCATION;
  storeStatus: STORE_STATUS;
  frequency: number;
  from?: number;
  to?: number;
};

export const frequencyByLocationAndStatusAndRange: IFrequencyParameter[] = [
  { locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 3 },
  { locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Hibernating, frequency: 3 },
  { locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Lead, frequency: 7},
  { locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.New, frequency: 3 },
  { locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Resurrected, frequency: 3 },
  { locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Retained, frequency: 3 },

  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Lead, frequency: 3},
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.New, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Lead, frequency: 2},
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.New, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Hibernating, frequency: 3 },
  { locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Lead, frequency: 0},
  { locationId: LOCATION.CMX, storeStatus: STORE_STATUS.New, frequency: 7 },
  { locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Resurrected, frequency: 7 },
  { locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Retained, frequency: 7 },

  { locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 3 },
  { locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Hibernating, frequency: 3 },
  { locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Lead, frequency: 7 },
  { locationId: LOCATION.MDE, storeStatus: STORE_STATUS.New, frequency: 3 },
  { locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Resurrected, frequency: 3 },
  { locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Retained, frequency: 3 },

  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Retained, frequency: 2 },
  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.New, frequency: 2 },
  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
]

export const getLocationStatusRangeKey = (frequencyParameter: Partial<IFrequencyParameter>) => {
  const { locationId, storeStatus, from, to } = frequencyParameter;
  const timeRange = from || to
    ? `${from ?? 'Any'}-${to ?? 'Any'}`
    : null;
  return `${locationId}|${storeStatus}|${timeRange ?? ''}`;
}

export const frequencyMap = frequencyByLocationAndStatusAndRange
  .reduce((acc, parameter) => {
    acc.set(getLocationStatusRangeKey(parameter), parameter.frequency);
    return acc;
  }, new Map<string, number>());

const generateParams = (
  params: string[], 
  length: number
) => 
  Array.from({ length }, (_, i) => params.map(p => `${p}_${i + 1}`)).flat();

const NAME = ['name'];
const DEFAULT = NAME.concat(generateParams(['sku', 'dsct'], 2));
const SKU_DSCT = ['sku', 'dsct'];
const SKU_DSCT_IMG = ['sku', 'dsct', 'img'];

export const TESTING_CLIENTS = ['+573153108376'];

export const campaignsBySatatus: TypeCampaignByStatus = {
  [STORE_STATUS.Churn]: {
    names: [],
    variables: {
      _default: DEFAULT,
      API_Churn_1_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Churn_2_es_v0: NAME.concat(generateParams(SKU_DSCT, 2)),
      API_Churn_3_es_v0: NAME.concat(generateParams(SKU_DSCT, 3)),
      API_Churn_4_es_v0: NAME.concat(generateParams(SKU_DSCT, 4)),
      API_Churn_5_es_v0: NAME.concat(generateParams(SKU_DSCT, 5)),
      API_Churn_6_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Churn_7_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
      API_Churn_8_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 3)),
      API_Churn_9_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 4)),
      API_Churn_10_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 5)),
      API_Churn_11_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Churn_12_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
    }
  },
  [STORE_STATUS.Lead]: {
    names: [],
    variables: {
      _default: DEFAULT,
      API_Lead_1_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Lead_2_es_v0: NAME.concat(generateParams(SKU_DSCT, 2)),
      API_Lead_3_es_v0: NAME.concat(generateParams(SKU_DSCT, 3)),
      API_Lead_4_es_v0: NAME.concat(generateParams(SKU_DSCT, 4)),
      API_Lead_5_es_v0: NAME.concat(generateParams(SKU_DSCT, 5)),
      API_Lead_6_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Lead_7_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
      API_Lead_8_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 3)),
      API_Lead_9_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 4)),
      API_Lead_10_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 5)),
      API_Lead_11_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Lead_12_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
    }
  },
  [STORE_STATUS.New]: {
    names: [],
    variables: {
      _default: DEFAULT,
      API_New_1_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_New_2_es_v0: NAME.concat(generateParams(SKU_DSCT, 2)),
      API_New_3_es_v0: NAME.concat(generateParams(SKU_DSCT, 3)),
      API_New_4_es_v0: NAME.concat(generateParams(SKU_DSCT, 4)),
      API_New_5_es_v0: NAME.concat(generateParams(SKU_DSCT, 5)),
      API_New_6_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_New_7_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
      API_New_8_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 3)),
      API_New_9_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 4)),
      API_New_10_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 5)),
      API_New_11_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_New_12_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
    },
  },
  [STORE_STATUS.Hibernating]: {
    names: [],
    variables: {
      _default: DEFAULT,
      API_Hibernating_1_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Hibernating_2_es_v0: NAME.concat(generateParams(SKU_DSCT, 2)),
      API_Hibernating_3_es_v0: NAME.concat(generateParams(SKU_DSCT, 3)),
      API_Hibernating_4_es_v0: NAME.concat(generateParams(SKU_DSCT, 4)),
      API_Hibernating_5_es_v0: NAME.concat(generateParams(SKU_DSCT, 5)),
      API_Hibernating_6_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Hibernating_7_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
      API_Hibernating_8_es_v2: NAME.concat(generateParams(SKU_DSCT_IMG, 3)),
      API_Hibernating_9_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 4)),
      API_Hibernating_10_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 5)),
      API_Hibernating_11_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Hibernating_12_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
    }

  },
  [STORE_STATUS.Retained]: {
    names: [],
    variables: {
      _default: DEFAULT,
      API_Retained_1_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Retained_2_es_v0: NAME.concat(generateParams(SKU_DSCT, 2)),
      API_Retained_3_es_v0: NAME.concat(generateParams(SKU_DSCT, 3)),
      API_Retained_4_es_v0: NAME.concat(generateParams(SKU_DSCT, 4)),
      API_Retained_5_es_v0: NAME.concat(generateParams(SKU_DSCT, 5)),
      API_Retained_6_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Retained_7_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
      API_Retained_8_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 3)),
      API_Retained_9_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 4)),
      API_Retained_10_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 5)),
      API_Retained_11_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Retained_12_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
    }

  },
  [STORE_STATUS.Resurrected]: {
    names: [],
    variables: {
      _default: DEFAULT,
      API_Resurrected_1_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Resurrected_2_es_v0: NAME.concat(generateParams(SKU_DSCT, 2)),
      API_Resurrected_3_es_v0: NAME.concat(generateParams(SKU_DSCT, 3)),
      API_Resurrected_4_es_v0: NAME.concat(generateParams(SKU_DSCT, 4)),
      API_Resurrected_5_es_v0: NAME.concat(generateParams(SKU_DSCT, 5)),
      API_Resurrected_6_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Resurrected_7_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
      API_Resurrected_8_es_v1: NAME.concat(generateParams(SKU_DSCT_IMG, 3)),
      API_Resurrected_9_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 4)),
      API_Resurrected_10_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 5)),
      API_Resurrected_11_es_v0: NAME.concat(generateParams(SKU_DSCT, 1)),
      API_Resurrected_12_es_v0: NAME.concat(generateParams(SKU_DSCT_IMG, 2)),
    }
  },
  [STORE_STATUS._default]: {
    names: [],
    variables: {
      _default: NAME,
    }
  }
}

for (const campaignStatus in campaignsBySatatus) {
  const status = campaignStatus as unknown as STORE_STATUS;
  campaignsBySatatus[status].names = [];
  for (const campaign in campaignsBySatatus[status]?.variables) {
    if (campaign === '_default') {
      continue;
    }
    campaignsBySatatus[status].names.push(campaign);
  }
}
