import { LOCATION, PROVIDER, STORE_STATUS } from '../enums.ts';

export interface IFrequencyParameter {
  locationId: LOCATION;
  storeStatus: STORE_STATUS;
  frequency: number;
  from?: number | null;
  to?: number | null;
}

export interface IConnectlyCampaignParameter {
  provider: PROVIDER;
  name: string;
  variables: string[];
  paths: string[];
}
