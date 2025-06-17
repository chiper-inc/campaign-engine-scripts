import { CHANNEL, SERVICE_PROVIDER } from '../enums.ts';
import { CHANNEL_PROVIDER } from '../constants.ts';
import * as CONNECTLY from '../mocks/connectly-campaigns.mock.ts';
import * as CLEVERTAP from '../mocks/clevertap-campaigns.mock.ts';
import * as META from '../mocks/meta-campaigns.mock.ts';
import { ICampaignParameter } from '../mocks/interfaces.ts';
import { TypeStoreParams } from '../types.ts';

console.log(META.metaCampaignMap);

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
  ...META.metaCampaignMap.entries(),
  ...CONNECTLY.connectlyCampaignMap.entries(),
  ...CLEVERTAP.clevertapCampaignMap.entries(),
]);

export const messagesPerCampaign = {
  [CHANNEL.WhatsApp]:
    CHANNEL_PROVIDER[CHANNEL.WhatsApp] === SERVICE_PROVIDER.Meta
      ? { min: META.minMessagesPerCampaign, max: META.maxMessagesPerCampaign }
      : {
          min: CONNECTLY.minMessagesPerCampaign,
          max: CONNECTLY.maxMessagesPerCampaign,
        },
  [CHANNEL.PushNotification]: {
    min: CLEVERTAP.minMessagesPerCampaign,
    max: CLEVERTAP.maxMessagesPerCampaign,
  },
};

console.log(campaignMap, messagesPerCampaign);
