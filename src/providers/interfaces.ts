import { ICallToAction, IUtm } from '../providers/interfaces.ts';
import { CampaignProvider } from '../providers/campaign.provider.ts';
import {
  TypeCampaignEntry,
  TypeRanking,
  TypeSku,
  TypeStore,
  TypeStoreParams,
} from '../types.ts';
import { OFFER_TYPE } from '../repositories/interfaces.ts';

export { IUtm, ICallToAction } from '../integrations/interfaces.ts';

export interface IUtmCallToAction {
  callToAction: Partial<ICallToAction>;
  utm: IUtm;
  storeId: number;
  skus: TypeSku[];
  rankings: TypeRanking[];
}
export interface ICommunication {
  storeId: number;
  campaignService?: CampaignProvider;
  utm: IUtm;
  utmCallToAction: IUtmCallToAction;
  utmCallToActions: IUtmCallToAction[];
  shortLink?: ICallToActionLink;
  shortLinks?: ICallToActionLink[];
}

export interface IStoreRecommendation {
  store: TypeStore;
  params: TypeStoreParams;
  campaign: TypeCampaignEntry;
  skus: TypeSku[];
  rankings: TypeRanking[];
  utm: IUtm;
}

export interface IOffer {
  sku: TypeSku;
  type: OFFER_TYPE;
  storeReferenceId?: number;
  referencePromotionId?: number;
  rankingStore: number | null;
  rankingSegment: number | null;
}
export interface ICallToActionLink {
  fullUrl: string;
  shortenUrl: string;
  campaignContent: string;
}
