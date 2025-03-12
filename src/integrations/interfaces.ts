import { TypeConnectlyCampaignVariables } from "./types.ts";

export interface IStoreReferenceData {
  referenceId: number;
  storeReferenceId: number;
  regular: string;
};

export interface ICallToAction {
  actionTypeId: number;
  storeReferenceId: number;
  referenceId: number;
  storeReferenceIds: number[];
  brandId: number;
  macroId: number;
}

export interface IUtm {
  campaignName: string;
  campaignSource: string;
  campaignMedium: string;
  campaignContent: string;
  campaignTerm: string;
}

export interface IShortLinkPayload {
  callToAction: ICallToAction,
  utm: IUtm,
};

export interface IConnectlyEntry {
  client: string;
  campaignName: string;
  variables: TypeConnectlyCampaignVariables;
};

