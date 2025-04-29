import {
  IClevertapMessage,
  IConnectlyEntry,
  IUtm,
} from '../integrations/interfaces.ts';
import { TypeCampaignVariables } from '../types.ts';
import { MessageMetadata } from './message.metadata.ts';

export abstract class MessageProvider {
  protected utmValue: Partial<IUtm>;
  protected readonly variablesValues: TypeCampaignVariables;
  protected readonly lng: string;
  protected readonly message: string;
  protected readonly campaignId: string;
  protected readonly metadataValues: MessageMetadata[];

  protected constructor(
    campaignId: string,
    messageName: string,
    utm: Partial<IUtm>,
    lng = 'es',
  ) {
    this.lng = lng;
    this.utmValue = { ...utm };
    this.variablesValues = {};
    this.campaignId = campaignId;
    this.message = messageName;
    this.metadataValues = [];
  }

  public get utm(): IUtm {
    return this.utmValue as IUtm;
  }

  // public set utm(utm: IUtm) {
  //   this.utmValue = utm;
  // }

  public get messageName(): string {
    return this.message;
  }

  public get variables(): TypeCampaignVariables {
    return this.variablesValues;
  }

  public get metadata(): MessageMetadata[] {
    return this.metadataValues;
  }

  public set metadata(messageMetadata: MessageMetadata[]) {
    this.metadataValues.length = 0;
    this.metadataValues.push(...messageMetadata);
  }

  public abstract setVariables(vars: TypeCampaignVariables): this;

  public abstract setPaths(vars: TypeCampaignVariables): this;

  public abstract get integrationBody(): {
    data: IConnectlyEntry | IClevertapMessage;
    metadata: unknown;
  };
}
