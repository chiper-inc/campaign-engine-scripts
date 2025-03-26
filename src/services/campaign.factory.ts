import { CHANNEL } from '../enums.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { ClevertapCampaignService } from './clevertap.campaign.service.ts';
import { ConnectlyCampaignService } from './connectly.campaign.service.ts';
import { CampaignService } from './campaign.service.ts';
import { TypeCampaignVariables, TypeStore } from '../types.ts';

export class CampaignFactory {
  public static createCampaignService(
    channel: CHANNEL,
    store: TypeStore,
    campaignName: string,
    variables: TypeCampaignVariables,
    utm: IUtm,
    lng = 'es',
  ): CampaignService {
    switch (channel) {
      case CHANNEL.PushNotification:
        return new ClevertapCampaignService(
          store,
          campaignName,
          variables,
          utm,
          lng,
        );
      case CHANNEL.WhatsApp:
        return new ConnectlyCampaignService(
          store,
          campaignName,
          variables,
          utm,
          lng,
        );
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }
}
