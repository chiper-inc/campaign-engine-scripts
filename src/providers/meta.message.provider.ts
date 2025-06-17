import { TypeStore } from '../types.ts';
import { IMetaEvent, IUtm } from '../integrations/interfaces.ts';
import { MessageMetadata } from './message.metadata.ts';
import { WhatsappMessageProvider } from './whatsapp-message.provider.ts';

export class MetaMessageProvider extends WhatsappMessageProvider {
  private readonly toPhoneNumber: string;

  constructor(store: TypeStore, campaignName: string, utm: Partial<IUtm>) {
    super(store, campaignName, utm);
    this.toPhoneNumber = `+${store.phone}`;
  }

  public get integrationBody(): {
    data: IMetaEvent;
    metadata: MessageMetadata[];
  } {
    return {
      data: {
        toPhoneNumber: this.toPhoneNumber,
        content: {
          name: this.campaignId.replace(/\./g, '_'),
          language: this.lng,
          carousel: { body: this.generateBody(), cards: this.generateCards() },
        },
      },
      metadata: this.metadataValues,
    };
  }

  private generateBody(): IMetaEvent['content']['carousel']['body'] {
    return { '0': { text: this.variablesValues['greeting'] as string } };
  }

  private generateCards(): IMetaEvent['content']['carousel']['cards'] {
    const skus = Object.keys(this.variablesValues)
      .filter((key) => key.startsWith('sku_'))
      .map((key) => key.replace('sku_', ''));
    return skus.map((sku) => ({
      header: { image: { link: this.variablesValues[`img_${sku}`] as string } },
      body: { '0': { text: this.variablesValues[`sku_${sku}`] as string } },
      buttons: [{ path: this.variablesValues[`path_${sku}`] as string }],
    }));
  }
}
