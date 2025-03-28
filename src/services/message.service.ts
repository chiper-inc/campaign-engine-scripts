import { IUtm } from '../integrations/interfaces.ts';
import { TypeCampaignVariables } from '../types.ts';

export abstract class MessageService {
  protected utmValue: IUtm;
  protected varValues: TypeCampaignVariables;
  protected readonly lng: string;
  protected readonly messageNumber: number;
  protected readonly campaignId: string;

  protected constructor(
    campaigId: string,
    messageNumber: number,
    utm: IUtm,
    lng = 'es',
  ) {
    this.lng = lng;
    this.utmValue = { ...utm };
    this.varValues = {};
    this.campaignId = campaigId;
    this.messageNumber = messageNumber;
  }

  public get utm(): IUtm {
    return this.utmValue;
  }

  public set utm(utm: IUtm) {
    this.utmValue = utm;
  }

  public abstract setVariables(vars: TypeCampaignVariables): this;

  public abstract get integrationBody(): unknown;
}
