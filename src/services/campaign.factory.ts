import { CHANNEL } from '../enums.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { ClevertapService } from './clevertap.service.ts';
import { ConnectlyService } from './connectly.service.ts';
import { CampaignService } from './campaign.service.ts';

export class CampaignFactory {
  public static createCampaignService(
    channel: CHANNEL,
    lng: string,
    utm: IUtm,
  ): CampaignService {
    switch (channel) {
      case CHANNEL.PushNotification:
        return new ClevertapService(lng, utm);
      case CHANNEL.WhatsApp:
        return new ConnectlyService(lng, utm);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }
}