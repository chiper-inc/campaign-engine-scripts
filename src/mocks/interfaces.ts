import { LOCATION, STORE_STATUS } from '../enums.ts';

export interface IFrequencyParameter {
  locationId: LOCATION;
  storeStatus: STORE_STATUS;
  frequency: number;
  from?: number;
  to?: number;
}

export interface IConnectlyCampaignParameter {
  name: string;
  variables: string[];
  paths: string[];
}
