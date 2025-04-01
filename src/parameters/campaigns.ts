import { CHANNEL } from '../enums.ts';
import { CHANNEL_PROVIDER } from '../constants.ts';
import { ICampaignParameter } from '../mocks/interfaces.ts';
import { connectlyCampaignMap } from '../mocks/connectly-campaigns.mock.ts';
import { clevertapCampaignMap } from '../mocks/clevertap-campaigns.mock.ts';
import { TypeStoreParams } from '../types.ts';

export const getCampaignSegmentName = (params: TypeStoreParams): string => {
  const { storeStatus, storeValue, from, to } = params;
  const storeValueKey = storeValue ? `.${storeValue}` : '';
  const timeRangeKey = from || to ? `.${from ?? 'Any'}-${to ?? 'Any'}` : '';
  return `${storeStatus}${storeValueKey}${timeRangeKey}`;
};

export const getCampaignKey = ({
  communicationChannel,
  numberOfSkus,
  lng = 'es',
}: {
  communicationChannel: CHANNEL;
  numberOfSkus: number;
  lng?: string;
}): string =>
  `${CHANNEL_PROVIDER[communicationChannel]}|${numberOfSkus}|${lng}`;

export const campaignMap = new Map<string, ICampaignParameter[]>([
  ...connectlyCampaignMap.entries(),
  ...clevertapCampaignMap.entries(),
]);
