import { LOCATION, STORE_STATUS } from "./enums.ts";

export type TypeFrequencyByStatus = {
  [key in STORE_STATUS]: {
    [key in LOCATION]?: number;
  } | number;
};

export type TypeCampaignStatus = {
  names: string[];
  variables: {
    [key: string]: string[];
  }
};

export type TypeCampaignByStatus = {
  [key in STORE_STATUS]: TypeCampaignStatus;
};

export type TypeStore = {
  storeId: number;
  name: string;
  phone: string;
}

export type TypeSku = {
  storeReferenceId: number;
  reference: string;
  discountFormatted: string;
  image: string;
}

export type TypeCampaignEntry = {
  name: string;
  variables: string[];
};
