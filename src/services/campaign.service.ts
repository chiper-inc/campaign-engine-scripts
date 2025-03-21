import { IUtm } from "../integrations/interfaces.ts";

export abstract class CampaignService {
  protected readonly lng: string = 'es';
  protected constructor(lng = 'es'){
    this.lng = lng;
  }

  public abstract utm: IUtm;
}