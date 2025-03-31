import { TypeCampaignVariables } from '../types.ts';

export interface IStoreReferenceData {
  referenceId: number;
  storeReferenceId: number;
  regular: string;
}

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
export interface ICallToActionLink {
  fullUrl: string;
  shortenUrl: string;
}

export interface IShortLinkPayload {
  callToAction: Partial<ICallToAction>;
  utm: IUtm;
}

export interface IShortLinkPayloadAndKey {
  key: string;
  value: IShortLinkPayload;
  // campaignService: CampaignService;
}
export interface IConnectlyEntry {
  client: string;
  campaignName: string;
  variables: TypeCampaignVariables;
}
export interface IClevertapMessage {
  to: { identity: string[] };
  campaign_id: string;
  ExternalTrigger: TypeCampaignVariables;
}
export interface ICatalogueReference {
  id: number;
  sku: string;
  name: string;
  description: string;
  display: string;
  stockout: number;
  regularTotal: string;
  discount?: number;
  discountedTotal?: string;
  discountedMaximumQuantity?: number;
  packaging: string;
  brandName: string;
  brandId: number;
  categoryId: number;
  macroId: number;
  url: string;
  source: string;
  showAs: string;
}

export interface IClevertapCampaign {
  message: IClevertapMessage;
  inSeconds?: number;
  timeoutSeconds?: number;
}
