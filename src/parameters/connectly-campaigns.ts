import { STORE_STATUS, STORE_VALUE } from '../enums.ts';
import { connectlyConnectlyCampaigns } from '../mocks/connectly-campaigns.mock.ts';
import { IConnectlyDetailCampaignParameter } from './interfaces.ts';
import { PROVIDER_CHANNEL } from '../constants.ts';

const getSubSegment = (
  subsegment: string,
): {
  storeValue?: STORE_VALUE;
  from?: number | null;
  to?: number | null;
} => {
  if (!subsegment) return {};

  if (subsegment.indexOf('to') === -1) {
    return { storeValue: subsegment as STORE_VALUE };
  }

  const [from, to] = subsegment.split('to');
  return {
    from: isNaN(Number(from)) ? null : Number(from),
    to: isNaN(Number(to)) ? null : Number(to),
  };
};

const connectlyCampaignList: IConnectlyDetailCampaignParameter[] =
  connectlyConnectlyCampaigns.map((campaign) => {
    const [, fullSegment] = campaign.name.split('_');
    const [segment, subsegment] = fullSegment.split('.');
    return {
      name: campaign.name,
      communicationChannel: PROVIDER_CHANNEL[campaign.provider],
      storeStatus: segment as STORE_STATUS,
      variables: campaign.variables.sort((a, b) => a.localeCompare(b)),
      paths: campaign.paths.sort((a, b) => a.localeCompare(b)),
      ...getSubSegment(subsegment),
    };
  });

export const getConnectlyCampaignKey = (
  campaign: Partial<IConnectlyDetailCampaignParameter>,
): string =>
  `${campaign.communicationChannel}|${campaign.storeStatus}|${campaign.storeValue ?? ''}|${campaign.from ?? ''}|${campaign.to ?? ''}`;

export const connectlyCampaignMap = connectlyCampaignList.reduce(
  (acc, campaign) => {
    const key = getConnectlyCampaignKey(campaign);
    const current = acc.get(key) || [];
    acc.set(key, current.concat(campaign));
    return acc;
  },
  new Map<string, IConnectlyDetailCampaignParameter[]>(),
);
