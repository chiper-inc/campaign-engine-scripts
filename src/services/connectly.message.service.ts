import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { MessageService } from './message.service.ts';

export class ConnectlyMessageService extends MessageService {
  private readonly client: string;
  constructor(store: TypeStore, campaignName: string, utm: IUtm) {
    const [, , message] = campaignName.split('_');
    const campaignId = campaignName.replace(/_/g, ' ').toLowerCase();
    const messageNumber = Number(message);
    super(campaignId, messageNumber, utm);
    this.client = `+${store.phone}`;
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
