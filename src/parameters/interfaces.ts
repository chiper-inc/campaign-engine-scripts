import { STORE_STATUS, STORE_VALUE } from '../enums.ts';

export interface IConnectlyCampaignParameter {
  name: string;
  storeStatus: STORE_STATUS;
  variables: string[];
  paths: string[];
  storeValue?: STORE_VALUE;
  from?: number | null;
  to?: number | null;
}
