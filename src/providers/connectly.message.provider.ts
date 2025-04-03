import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { MessageProvider } from './message.provider.ts';

export class ConnectlyMessageProvider extends MessageProvider {
  private readonly client: string;
  constructor(store: TypeStore, campaignName: string, utm: IUtm) {
    const [, messageClass, messageNumber] = campaignName.split('_');
    const campaignId = campaignName.replace(/_/g, ' ').toLowerCase();
    super(campaignId, `${messageClass}.${messageNumber}`, utm);
    this.client = `+${store.phone}`;
    this.utm.campaignName = `${this.utm.campaignName}_${campaignName.replace(/_/g, '-')}`;
  }

  public setVariables(vars: TypeCampaignVariables): this {
    this.varValues = { ...vars };
    return this;
  }

  public get integrationBody(): unknown {
    return {
      client: this.client,
      campaignName: this.campaignId,
      variables: this.varValues,
    };
  }
}
