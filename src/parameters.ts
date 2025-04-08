import { STORE_STATUS } from './enums.ts';
import { TypeCampaignByStatus } from './types.ts';
import {
  frequencyMap,
  getLocationStatusRangeKey,
  frequencyByLocationAndStatusAndRange,
} from './parameters/frequencies.ts';
import { campaignMap, getCampaignKey } from './parameters/campaigns.ts';

export {
  frequencyMap,
  frequencyByLocationAndStatusAndRange,
  getLocationStatusRangeKey,
  campaignMap,
  getCampaignKey,
};

const generateParams = (params: string[], length: number) =>
  Array.from({ length }, (_, i) => params.map((p) => `${p}_${i + 1}`)).flat();

const NAME = ['name'];
const DEFAULT = NAME.concat(generateParams(['sku', 'dsct'], 2));

export const TESTING_CLIENTS = ['+573153108376'];

export const campaignsBySatatus: TypeCampaignByStatus = {
  [STORE_STATUS.Churn]: {
    names: [],
    variables: {
      _default: DEFAULT,
    },
  },
  [STORE_STATUS.Lead]: {
    names: [],
    variables: {
      _default: DEFAULT,
    },
  },
  [STORE_STATUS.New]: {
    names: [],
    variables: {
      _default: DEFAULT,
    },
  },
  [STORE_STATUS.Hibernating]: {
    names: [],
    variables: {
      _default: DEFAULT,
    },
  },
  [STORE_STATUS.Retained]: {
    names: [],
    variables: {
      _default: DEFAULT,
    },
  },
  [STORE_STATUS.Resurrected]: {
    names: [],
    variables: {
      _default: DEFAULT,
    },
  },
  [STORE_STATUS._default]: {
    names: [],
    variables: {
      _default: NAME,
    },
  },
};

for (const campaignStatus in campaignsBySatatus) {
  const status = campaignStatus as unknown as STORE_STATUS;
  campaignsBySatatus[status].names = [];
  for (const campaign in campaignsBySatatus[status]?.variables) {
    if (campaign === '_default') {
      continue;
    }
    campaignsBySatatus[status].names.push(campaign);
    campaignsBySatatus[status].variables[campaign].sort((a, b) =>
      a.localeCompare(b),
    );
  }
}
