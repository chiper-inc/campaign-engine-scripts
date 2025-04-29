import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IConnectlyEntry, IUtm } from '../integrations/interfaces.ts';
import { MessageProvider } from './message.provider.ts';
import * as MOCKS from '../mocks/connectly-greetings.mock.ts';
import * as UTILS from '../utils/index.ts';
import { STORE_STATUS } from '../enums.ts';

export class ConnectlyMessageProvider extends MessageProvider {
  private static imageQueryParams = 'w=800&h=400&fit=fill&bg=white';

  private readonly client: string;
  private readonly greetingTemplate: string;
  constructor(store: TypeStore, campaignName: string, utm: Partial<IUtm>) {
    const [, messageClass, messageNumber] = campaignName.split('_');
    const campaignId = campaignName.replace(/_/g, ' ').toLowerCase();
    const greetings =
      MOCKS.GREETINGS[store.storeStatus] ||
      MOCKS.GREETINGS[STORE_STATUS._default];

    super(campaignId, `${messageClass}_${messageNumber}`, utm);

    this.greetingTemplate = UTILS.choose(greetings);
    this.client = `+${store.phone}`;
    this.utm.campaignName = UTILS.putMessageToCampaignString(
      this.utm.campaignName,
      campaignName,
    );
    // this.utm.campaignName = `${this.utm.campaignName}_${campaignName.replace(/_/g, '-')}`;
  }

  public setVariables(vars: TypeCampaignVariables): this {
    const newValues = this.generateConnectlyCarousel(vars);
    for (const key in newValues) {
      this.variablesValues[key] = newValues[key];
    }
    return this;
  }

  public setPaths(vars: TypeCampaignVariables): this {
    for (const key in vars) {
      if (key.startsWith('path')) {
        this.variablesValues[key] = vars[key];
      }
    }
    return this;
  }

  public get integrationBody(): { data: IConnectlyEntry; metadata: unknown } {
    return {
      data: {
        client: this.client,
        campaignName: this.campaignId,
        variables: this.variablesValues,
      },
      metadata: this.metadataValues,
    };
  }

  private generateConnectlyCarousel(
    obj: TypeCampaignVariables,
  ): TypeCampaignVariables {
    if (MOCKS.version === 'v2') {
      const vars: TypeCampaignVariables = { greeting: obj.greeting };
      for (const key in obj) {
        if (key.startsWith('sku') || key.startsWith('greeting')) {
          vars[key] = obj[key];
        } else if (key.startsWith('img')) {
          vars[key] = UTILS.addQueryParams(
            obj[key] as string,
            ConnectlyMessageProvider.imageQueryParams,
          );
        }
      }
      return vars;
    }
    return obj;
  }
}
