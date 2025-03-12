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
  [key in STORE_STATUS]: TypeCampaignStatus | {
    [key: string]: string[];
  };
};

