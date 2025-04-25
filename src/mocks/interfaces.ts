import { CHANNEL, LOCATION, SERVICE_PROVIDER, STORE_STATUS } from '../enums.ts';

export interface IFrequencyParameter {
  locationId: LOCATION;
  storeStatus: STORE_STATUS;
  communicationChannel: CHANNEL;
  frequency: number;
  from?: number | null;
  to?: number | null;
}

export interface ICampaignParameter {
  provider: SERVICE_PROVIDER;
  name: string;
  variables: string[];
  paths: string[];
}
