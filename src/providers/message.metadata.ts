import { TypeSku } from '../types.ts';
import { ICallToAction, IUtm, IUtmCallToAction } from './interfaces.ts';
import { Config } from '../config.ts';

// export interface IMetadata {
//   storeId: number;
//   campaignName: string; // Object | string;
//   recommendations: IMetadataRecommendation[];
// }

// export interface IMetadataRecommendation {
//   externalId: string; // Phone number | uuId-xxxxx-uuId
//   conntent: IMessageContent;
// }

// export interface IMetadataRecommendationConnectly
//   extends IMetadataRecommendation {
//   sendoutName: string; // Campaign Name
//   sendoutId: string; // sendoutId
// }

// export interface IMetadataRecommendationClevertap
//   extends IMetadataRecommendation {
//   campaingId: string; // Clevertap Campaign Id
// }

// export interface IMessageContent {
//   campaignContent: string; // uuid
//   storeReferenceId: number | null;
//   referencePromotionId: number | null;
// }

// export class CampaignMetadata implements IMetadata {
//   public storeId: number;
//   public campaignName: string;
//   public recommendations: MetadataRecommendation[];

//   constructor({
//     storeId,
//     campaignName,
//     recommendations,
//   }: {
//     storeId: number;
//     campaignName: string;
//     recommendations: MetadataRecommendation[];
//   }) {
//     this.storeId = storeId;
//     this.campaignName = campaignName;
//     this.recommendations = recommendations;
//   }
// }

// export class MetadataRecommendation implements IMetadataRecommendation {
//   public externalId: string; // Phone number | uuId-xxxxx-uuId
//   public conntent: MetadataMessageContent;

//   constructor({
//     externalId,
//     conntent,
//   }: {
//     externalId: string;
//     conntent: MetadataMessageContent;
//   }) {
//     this.externalId = externalId;
//     this.conntent = conntent;
//   }
// }

// export class MetadataRecomendationClevertap
//   extends MetadataRecommendation
//   implements IMetadataRecommendationClevertap
// {
//   public campaingId: string; // Clevertap Campaign Id

//   constructor({
//     externalId,
//     conntent,
//     campaingId,
//   }: {
//     externalId: string;
//     conntent: MetadataMessageContent;
//     campaingId: string;
//   }) {
//     super({ externalId, conntent });
//     this.campaingId = campaingId;
//   }
// }

// export class MetadataRecomendationConnectly
//   extends MetadataRecommendation
//   implements IMetadataRecommendationConnectly
// {
//   public sendoutName: string; // Campaign Name
//   public sendoutId: string; // sendoutId

//   constructor({
//     externalId,
//     conntent,
//     sendoutName,
//     sendoutId,
//   }: {
//     externalId: string;
//     conntent: MetadataMessageContent;
//     sendoutName: string;
//     sendoutId: string;
//   }) {
//     super({ externalId, conntent });
//     this.sendoutName = sendoutName;
//     this.sendoutId = sendoutId;
//   }
// }

// export class MetadataMessageContent implements IMessageContent {
//   public campaignContent: string; // uuid
//   public storeReferenceId: number | null;
//   public referencePromotionId: number | null;

//   constructor({
//     campaignContent,
//     storeReferenceId,
//     referencePromotionId,
//   }: {
//     campaignContent: string;
//     storeReferenceId: number | null;
//     referencePromotionId: number | null;
//   }) {
//     this.campaignContent = campaignContent;
//     this.storeReferenceId = storeReferenceId;
//     this.referencePromotionId = referencePromotionId;
//   }
// }

export interface IMessageMetadata<T> {
  data: T;
  metadata: MessageMetadata[];
}

export type MessageMetadataList<T> = IMessageMetadata<T>[];
export class MessageMetadata {
  public static actionType = {
    [Config.lbApiOperaciones.callToAction.reference]: 'GO_TO_REFERENCE',
    [Config.lbApiOperaciones.callToAction.referencePromotion]:
      'GO_TO_REFERENCE_PROMOTION',
    [Config.lbApiOperaciones.callToAction.offerList]: 'GO_TO_CUSTOM_OFFER',
    [Config.lbApiOperaciones.callToAction.discountList]: 'GO_TO_DISCOUNT_LIST',
    [Config.lbApiOperaciones.callToAction.macro]: 'GO_TO_MACRO',
    [Config.lbApiOperaciones.callToAction.brand]: 'GO_TO_BRAND',
  };

  readonly $skus: TypeSku[];
  readonly $utm: IUtm;
  readonly storeId: number;
  readonly $callToAction: Partial<ICallToAction>;

  constructor({ skus, utm, storeId, callToAction }: IUtmCallToAction) {
    this.$skus = skus;
    this.$utm = utm;
    this.storeId = storeId;
    this.$callToAction = callToAction;
    console.log('MessageMetadata', {
      skus,
      utm,
      storeId,
      callToAction,
    });
  }
  public get skus(): TypeSku[] {
    return this.$skus;
  }
  public get utm(): IUtm {
    return this.$utm;
  }
  public get store(): number {
    return this.storeId;
  }
  public get callToAction(): ICallToAction {
    return this.$callToAction as ICallToAction;
  }

  public expand(i: number, f: (i?: number, j?: number) => string): unknown {
    const { callToAction, skus, utm, store } = this;
    return {
      store,
      utm,
      callToAction: {
        ...callToAction,
        actionType: MessageMetadata.actionType[callToAction.actionTypeId],
      },
      skus: skus.map((sku, j) => ({ ...sku, copy: f(i, j) })),
    };
  }
}
