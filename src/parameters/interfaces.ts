import { STORE_STATUS, STORE_VALUE } from '../enums.ts';
export interface IConnectlyDetailCampaignParameter {
  name: string;
  variables: string[];
  paths: string[];
  storeStatus: STORE_STATUS;
  from?: number | null;
  to?: number | null;
  storeValue?: STORE_VALUE;
}
