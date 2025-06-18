import { TypeStore } from '../types.ts';
import { IConnectlyEvent, IUtm } from '../integrations/interfaces.ts';
import { MessageMetadata } from './message.metadata.ts';
import { WhatsappMessageProvider } from './whatsapp-message.provider.ts';

export class ConnectlyMessageProvider extends WhatsappMessageProvider {
  private readonly client: string;

  constructor(store: TypeStore, campaignName: string, utm: Partial<IUtm>) {
    super(store, campaignName, utm);
    this.client = `+${store.phone}`;
  }

  public get integrationBody(): {
    data: IConnectlyEvent;
    metadata: MessageMetadata[];
  } {
    return {
      data: {
        client: this.client,
        campaignName: this.campaignId.replace(/_/g, ' '),
        variables: this.variablesValues,
      },
      metadata: this.metadataValues,
    };
  }
}
