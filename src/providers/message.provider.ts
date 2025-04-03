import { IUtm } from '../integrations/interfaces.ts';
import { TypeCampaignVariables } from '../types.ts';

export abstract class MessageProvider {
  protected utmValue: IUtm;
  protected varValues: TypeCampaignVariables;
  protected readonly lng: string;
  protected readonly message: string;
  protected readonly campaignId: string;

  protected constructor(
    campaignId: string,
    messageName: string,
    utm: IUtm,
    lng = 'es',
  ) {
    this.lng = lng;
    this.utmValue = { ...utm };
    this.varValues = {};
    this.campaignId = campaignId;
    this.message = messageName;
  }

  public get utm(): IUtm {
    return this.utmValue;
  }

  public set utm(utm: IUtm) {
    this.utmValue = utm;
  }

  public get messageName(): string {
    return this.message;
  }

  public abstract setVariables(vars: TypeCampaignVariables): this;

  public abstract get integrationBody(): unknown;
}
