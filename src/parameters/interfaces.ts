import { CHANNEL, STORE_STATUS, STORE_VALUE } from '../enums.ts';
export interface IConnectlyDetailCampaignParameter {
  name: string;
  variables: string[];
  paths: string[];
  storeStatus: STORE_STATUS | null;
  communicationChannel: CHANNEL;
  from?: number | null;
  to?: number | null;
  storeValue: STORE_VALUE | null;
}
