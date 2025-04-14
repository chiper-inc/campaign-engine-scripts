import { CHANNEL } from '../enums.ts';
import { CHANNEL_PROVIDER } from '../constants.ts';
import * as CONNECTLY from '../mocks/connectly-campaigns.mock.ts';
import * as CLEVERTAP from '../mocks/clevertap-campaigns.mock.ts';
import { ICampaignParameter } from '../mocks/interfaces.ts';
import { TypeStoreParams } from '../types.ts';

export const getCampaignSegmentName = (params: TypeStoreParams): string => {
  const { storeStatus, storeValue, from, to } = params;
  const storeValueKey = storeValue ? `.${storeValue}` : '';
  const timeRangeKey = from || to ? `.${from ?? 'Any'}to${to ?? 'Any'}` : '';
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
  ...CONNECTLY.connectlyCampaignMap.entries(),
  ...CLEVERTAP.clevertapCampaignMap.entries(),
]);

export const messagesPerCampaign = {
  [CHANNEL.WhatsApp]: {
    min: CONNECTLY.minMessagesPerCampaign,
    max: CONNECTLY.maxMessagesPerCampaign,
  },
  [CHANNEL.PushNotification]: {
    min: CLEVERTAP.minMessagesPerCampaign,
    max: CLEVERTAP.maxMessagesPerCampaign,
  },
};
