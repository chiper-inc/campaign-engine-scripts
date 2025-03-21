
import { IUtm } from '../integrations/interfaces.ts';
import { CampaignService } from './campaign.service.ts';

export class ConnectlyService extends CampaignService {
  private readonly utmValue: IUtm;
  constructor(lng: string, utm: IUtm) {
    super(lng);
    this.utmValue = { ...utm };
  };

  public get utm(): IUtm {
    return this.utmValue;
  };
}
  