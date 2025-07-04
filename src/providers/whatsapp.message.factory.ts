import { TypeStore } from '../types.ts';
import { SERVICE_PROVIDER } from '../enums.ts';
import { IUtm } from './interfaces.ts';
import { WhatsappMessageProvider } from './whatsapp-message.provider.ts';
import { ConnectlyMessageProvider } from './connectly.message.provider.ts';
import { MetaMessageProvider } from './meta.message.provider.ts';

export class WhatsappMessageFactory {
  public static createWhatsappMessageProvider(
    serviceProvider: SERVICE_PROVIDER,
    {
      store,
      campaignName,
      utm,
    }: { store: TypeStore; campaignName: string; utm: Partial<IUtm> },
  ): WhatsappMessageProvider {
    switch (serviceProvider) {
      case SERVICE_PROVIDER.Connectly:
        return new ConnectlyMessageProvider(store, campaignName, utm);
      case SERVICE_PROVIDER.Meta:
        return new MetaMessageProvider(store, campaignName, utm);
      default:
        throw new Error(`Unsupported Service Provider: ${serviceProvider}`);
    }
  }
}
