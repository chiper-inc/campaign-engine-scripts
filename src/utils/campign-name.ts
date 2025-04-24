import { LOCATION } from '../enums.ts';
import { formatMMMDD } from './date-utils.ts';
import { CITY, PROVIDER } from '../constants.ts';

export const getCityId = (locationId: LOCATION) => CITY[locationId] || 0;

export const getProvider = (locationId: LOCATION) => PROVIDER[locationId] || 0;

export const campaignToString = ({
  providerId,
  cityId,
  asset,
  payer,
  term,
  type,
  segment,
}: {
  providerId: number;
  cityId: number;
  asset: string;
  payer: string;
  term: string;
  type: string;
  segment: string;
}) =>
  `${cityId}_${providerId}_${
    asset
  }_${payer}_${formatMMMDD(term)}_${type}_${segment}`;

export const campaignFromString = (campaign: string) => {
  const [cityId, providerId, asset, payer, term, type, segment, messageValue] =
    campaign.split('_');
  const message = messageValue ? messageValue.replace(/-/g, '_') : undefined;
  return {
    cityId: Number(cityId),
    providerId: Number(providerId),
    asset,
    payer,
    term,
    type,
    segment,
    message: message as string | undefined,
  };
};

export const putMessageToCampaignString = (
  campaign: string,
  message: string,
) => {
  const messageValue = message ? `_${message.replace(/_/g, '-')}` : '';
  const [cityId, providerId, asset, payer, term, type, segment] =
    campaign.split('_');
  return `${cityId}_${providerId}_${asset}_${payer}_${term}_${type}_${segment}${
    messageValue
  }`;
};
