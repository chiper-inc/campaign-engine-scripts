import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { MessageProvider } from './message.provider.ts';
import * as MOCKS from '../mocks/connectly-greetings.mock.ts';
import * as UTILS from '../utils/index.ts';
import { STORE_STATUS } from '../enums.ts';

export class ConnectlyMessageProvider extends MessageProvider {
  private readonly client: string;
  private readonly greetingTemplate: string;
  constructor(store: TypeStore, campaignName: string, utm: IUtm) {
    const [, messageClass, messageNumber] = campaignName.split('_');
    const campaignId = campaignName.replace(/_/g, ' ').toLowerCase();
    const greetings =
      MOCKS.GREETINGS[store.storeStatus] ||
      MOCKS.GREETINGS[STORE_STATUS._default];

    super(campaignId, `${messageClass}.${messageNumber}`, utm);

    this.greetingTemplate = greetings[UTILS.getRandomNumber(greetings.length)];
    this.client = `+${store.phone}`;
    this.utm.campaignName = `${this.utm.campaignName}_${campaignName.replace(/_/g, '-')}`;
  }

  public setVariables(vars: TypeCampaignVariables): this {
    this.varValues = this.generateConnectlyCarousel(vars);
    return this;
  }

  public get integrationBody(): unknown {
    return {
      client: this.client,
      campaignName: this.campaignId,
      variables: this.varValues,
    };
  }

  private generateConnectlyCarousel(
    obj: TypeCampaignVariables,
  ): TypeCampaignVariables {
    if (MOCKS.version === 'v2') {
      const vars: TypeCampaignVariables = { greeting: obj.greeting };
      for (const key in obj) {
        if (
          key.startsWith('path') ||
          key.startsWith('sku') ||
          key.startsWith('img') ||
          key.startsWith('greeting')
        ) {
          vars[key] = obj[key];
        }
      }
      return vars;
    }
    return obj;
  }
}
