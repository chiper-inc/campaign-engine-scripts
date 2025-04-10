import { ICallToAction, IUtm } from '../providers/interfaces.ts';
import {
  IClevertapMessage,
  IConnectlyEntry,
} from '../integrations/interfaces.ts';
import { CampaignProvider } from '../providers/campaign.provider.ts';
import {
  TypeCampaignEntry,
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
}
export interface ICommunication {
  storeId: number;
  connectlyEntry: IConnectlyEntry | undefined;
  clevertapEntry: IClevertapMessage | undefined;
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
  utm: IUtm;
}

export interface IOffer {
  type: OFFER_TYPE;
  storeReferenceId?: number;
  referencePromotionId?: number;
}
export interface ICallToActionLink {
  fullUrl: string;
  shortenUrl: string;
}
