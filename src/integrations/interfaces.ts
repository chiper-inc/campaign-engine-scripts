import { MessageMetadata } from '../providers/message.metadata.ts';
import { TypeCampaignVariables } from '../types.ts';

export interface IStoreReferenceData {
  referenceId: number;
  storeReferenceId: number;
  regular: string;
}

export interface ICallToAction {
  actionTypeId: number;
  storeReferenceId: number;
  referencePromotionId: number;
  referenceId: number;
  storeReferenceIds: string[];
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
export interface IShortLinkRequest {
  callToAction: Partial<ICallToAction>;
  utm: IUtm;
  includeShortLink: boolean;
}

export interface IShortLinkResponse {
  utm: {
    shortenURL: string;
    websiteURL: string;
    campaignContent: string;
  };
}

export interface IShortLinkResponseAndKey {
  key: string;
  value: IShortLinkRequest;
  storeId: number;
}
export interface IConnectlyEvent {
  client: string;
  campaignName: string;
  variables: TypeCampaignVariables;
}

export interface IMetaSimpleText {
  text: string;
}

export interface IMetaSimpleBody {
  [key: string]: IMetaSimpleText;
}

export interface IMetaSimpleImage {
  image: { link: string };
}

export interface IMetaButtonPath {
  path: string
}
export interface IMetaEvent {
  toPhoneNumber: string;
  content: {
    language: string;
    name: string;
    carousel: {
      body: IMetaSimpleBody;
      cards: { 
        header: IMetaSimpleImage;
        body: IMetaSimpleBody;
        buttons: IMetaButtonPath[];
      }[];  
      };
    };
  };
}
export interface IClevertapEvent {
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
  message: { data: IClevertapEvent; metadata: MessageMetadata[] };
  inSeconds?: number;
  timeoutSeconds?: number;
}

export interface IReportSkuSummary {
  city: string;
  referenceId: string;
  referenceName: string;
  referenceImage: string;
  value: number;
  percentage?: number;
  referenceDiscount?: string | null;
}
