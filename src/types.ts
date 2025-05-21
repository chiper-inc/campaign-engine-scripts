import { CHANNEL, LOCATION, STORE_STATUS, STORE_VALUE } from './enums.ts';
import { IUtm } from './integrations/interfaces.ts';
import { OFFER_TYPE } from './repositories/interfaces.ts';

export type TypeFrequencyByStatus = {
  [key in STORE_STATUS]:
    | {
        [key in LOCATION]?: number;
      }
    | number;
};

export type TypeStoreParams = {
  communicationChannel: CHANNEL;
  locationId: LOCATION;
  storeStatus: STORE_STATUS;
  city: string;
  storeValue: STORE_VALUE | null;
  from: number | null;
  to: number | null;
};

export type TypeCampaignStatus = {
  names: string[];
  variables: {
    [key: string]: string[];
  };
};

export type TypeCampaignByStatus = {
  [key in STORE_STATUS]: TypeCampaignStatus;
};

export type TypeStore = {
  storeId: number;
  storeStatus: STORE_STATUS;
  name: string;
  phone: string;
};

export type TypeSku = {
  storeReferenceId: number | null;
  reference: string;
  copy: string;
  referencePromotionId: number | null;
  skuType: OFFER_TYPE;
  discountFormatted: string;
  image: string;
};

export type TypeRanking = {
  skuType: OFFER_TYPE;
  storeReferenceId: number | null;
  referencePromotionId: number | null;
  rankingStore: number | null;
  rankingSegment: number | null;
};

export type TypeCampaignEntry = {
  name: string;
  variables: string[];
  paths: string[];
};

export type TypeCampaignVariables = {
  [key: string]: string | number;
};

export type TypeCampaignMessage = {
  variables: TypeCampaignVariables;
  utm: IUtm;
};
