import {
  ICallToAction,
  ICallToActionLink,
  IUtm,
} from '../providers/interfaces.ts';
import {
  IClevertapMessage,
  IConnectlyEntry,
} from '../integrations/interfaces.ts';
import { CampaignProvider } from '../providers/campaign.provider.ts';

export interface IUtmCallToAction {
  callToAction: Partial<ICallToAction>;
  utm: IUtm;
  storeId: number;
}

export interface IPreEntry {
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
