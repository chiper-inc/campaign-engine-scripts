import { TypeSku } from '../types.ts';
import { ICallToAction, IUtm, IUtmCallToAction } from './interfaces.ts';

export interface IMetadata {
  storeId: number;
  campaignName: string; // Object | string;
  recommendations: IMetadataRecommendation[];
}

export interface IMetadataRecommendation {
  externalId: string; // Phone number | uuId-xxxxx-uuId
  conntent: IMessageContent;
}

export interface IMetadataRecommendationConnectly
  extends IMetadataRecommendation {
  sendoutName: string; // Campaign Name
  sendoutId: string; // sendoutId
}

export interface IMetadataRecommendationClevertap
  extends IMetadataRecommendation {
  campaingId: string; // Clevertap Campaign Id
}

export interface IMessageContent {
  campaignContent: string; // uuid
  storeReferenceId: number | null;
  referencePromotionId: number | null;
}

export class CampaignMetadata implements IMetadata {
  public storeId: number;
  public campaignName: string;
  public recommendations: MetadataRecommendation[];

  constructor({
    storeId,
    campaignName,
    recommendations,
  }: {
    storeId: number;
    campaignName: string;
    recommendations: MetadataRecommendation[];
  }) {
    this.storeId = storeId;
    this.campaignName = campaignName;
    this.recommendations = recommendations;
  }
}

export class MetadataRecommendation implements IMetadataRecommendation {
  public externalId: string; // Phone number | uuId-xxxxx-uuId
  public conntent: MetadataMessageContent;

  constructor({
    externalId,
    conntent,
  }: {
    externalId: string;
    conntent: MetadataMessageContent;
  }) {
    this.externalId = externalId;
    this.conntent = conntent;
  }
}

export class MetadataRecomendationClevertap
  extends MetadataRecommendation
  implements IMetadataRecommendationClevertap
{
  public campaingId: string; // Clevertap Campaign Id

  constructor({
    externalId,
    conntent,
    campaingId,
  }: {
    externalId: string;
    conntent: MetadataMessageContent;
    campaingId: string;
  }) {
    super({ externalId, conntent });
    this.campaingId = campaingId;
  }
}

export class MetadataRecomendationConnectly
  extends MetadataRecommendation
  implements IMetadataRecommendationConnectly
{
  public sendoutName: string; // Campaign Name
  public sendoutId: string; // sendoutId

  constructor({
    externalId,
    conntent,
    sendoutName,
    sendoutId,
  }: {
    externalId: string;
    conntent: MetadataMessageContent;
    sendoutName: string;
    sendoutId: string;
  }) {
    super({ externalId, conntent });
    this.sendoutName = sendoutName;
    this.sendoutId = sendoutId;
  }
}

export class MetadataMessageContent implements IMessageContent {
  public campaignContent: string; // uuid
  public storeReferenceId: number | null;
  public referencePromotionId: number | null;

  constructor({
    campaignContent,
    storeReferenceId,
    referencePromotionId,
  }: {
    campaignContent: string;
    storeReferenceId: number | null;
    referencePromotionId: number | null;
  }) {
    this.campaignContent = campaignContent;
    this.storeReferenceId = storeReferenceId;
    this.referencePromotionId = referencePromotionId;
  }
}

export class MessageMetadata {
  private static $skus: TypeSku[];
  private static $utm: IUtm;
  private static storeId: number;
  private static $callToAction: Partial<ICallToAction>;

  constructor({ skus, utm, storeId, callToAction }: IUtmCallToAction) {
    MessageMetadata.$skus = skus;
    MessageMetadata.$utm = utm;
    MessageMetadata.storeId = storeId;
    MessageMetadata.$callToAction = callToAction;
  }
  public static get skus(): TypeSku[] {
    return MessageMetadata.$skus;
  }
  public static get utm(): IUtm {
    return MessageMetadata.$utm;
  }
  public static get store(): number {
    return MessageMetadata.storeId;
  }
  public static get callToAction(): ICallToAction {
    return MessageMetadata.$callToAction as ICallToAction;
  }
}
