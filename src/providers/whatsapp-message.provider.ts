import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { MessageProvider } from './message.provider.ts';
import * as MOCKS from '../mocks/connectly-greetings.mock.ts';
import * as UTILS from '../utils/index.ts';
import { STORE_STATUS } from '../enums.ts';
import { IUtm } from './interfaces.ts';

export abstract class WhatsappMessageProvider extends MessageProvider {
  private static imageQueryParams = 'w=800&h=400&fit=fill&bg=white';

  private readonly greetingTemplate: string;
  constructor(store: TypeStore, campaignName: string, utm: Partial<IUtm>) {
    const [, messageClass, messageNumber] = campaignName.split('_'); // TODO: Adjust this if needed
    const campaignId = campaignName.toLowerCase(); // TODO: Adjust this if needed
    const greetings =
      MOCKS.GREETINGS[store.storeStatus] ||
      MOCKS.GREETINGS[STORE_STATUS._default];

    super(campaignId, `${messageClass}_${messageNumber}`, utm);

    this.greetingTemplate = UTILS.choose(greetings);
    this.utm.campaignName = UTILS.putMessageToCampaignString(
      this.utm.campaignName,
      campaignName,
    );
  }

  public setVariables(vars: TypeCampaignVariables): this {
    const newValues = this.generateWhatsappCarousel(vars);
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

  private generateWhatsappCarousel(
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
            WhatsappMessageProvider.imageQueryParams,
          );
        }
      }
      return vars;
    }
    return obj;
  }
}
