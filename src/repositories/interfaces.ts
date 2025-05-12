import { CHANNEL, LOCATION, STORE_STATUS, STORE_VALUE } from '../enums.ts';

export enum OFFER_TYPE {
  storeReference = 'storeReferenceId',
  referencePromotion = 'referencePromotionId',
}
export interface IStoreSuggestion {
  country: string;
  storeStatus: STORE_STATUS;
  storeValue: STORE_VALUE | null;
  storeId: number;
  city: string;
  locationId: LOCATION;
  recommendationType: OFFER_TYPE;
  recommendationId: number;
  name: string;
  reference: string;
  imageUrl: string;
  discountFormatted: string;
  phone: string;
  ranking: number;
  from?: number | null;
  to?: number | null;
  rangeName: string;
  valueName: string;
  communicationChannel: CHANNEL;
}
