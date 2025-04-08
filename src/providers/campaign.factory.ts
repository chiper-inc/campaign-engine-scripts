import { CHANNEL } from '../enums.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { ClevertapCampaignProvider } from './clevertap.campaign.provider.ts';
import { ConnectlyCampaignProvider } from './connectly.campaign.provider.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { TypeCampaignVariables, TypeStore } from '../types.ts';

export class CampaignFactory {
  public static createCampaignService(
    channel: CHANNEL,
    store: TypeStore,
    campaignName: string,
    variables: TypeCampaignVariables,
    utm: IUtm,
    lng = 'es',
  ): CampaignProvider {
    switch (channel) {
      case CHANNEL.PushNotification:
        return new ClevertapCampaignProvider(
          store,
          campaignName,
          variables,
          utm,
          lng,
        );
      case CHANNEL.WhatsApp:
        return new ConnectlyCampaignProvider(
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
