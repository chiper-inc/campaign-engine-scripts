import { IUtm } from '../integrations/interfaces.ts';
import { MessageProvider } from './message.provider.ts';
import * as MOCKS from '../mocks/clevertap-campaigns.mock.ts';
import { TypeCampaignVariables, TypeStore } from '../types.ts';
import * as UTILS from '../utils/index.ts';

export class ClevertapMessageProvider extends MessageProvider {
  private readonly titleTemplate: string;
  private readonly offerTemplate: string;
  private readonly identity: string;

  constructor(store: TypeStore, _: string, utm: IUtm) {
    const campaignName = utm.campaignName.split('_').slice(-1)[0] ?? '';
    const mainCampaign = `API_${campaignName.split('.')[0] ?? 'XYZ'}`;

    super(
      MOCKS.campaignIds[mainCampaign] || mainCampaign,
      MOCKS.version === 'v1' ? 'Random' : 'GenAI',
      utm,
    );

    const iTitle = UTILS.getRandomNumber(MOCKS.titles[mainCampaign].length);
    const iOffer = UTILS.getRandomNumber(MOCKS.offers[mainCampaign].length);
    const messageNumber = (iTitle + 1) * 100 + iOffer + 1;

    const messageName = `${mainCampaign}_${
      MOCKS.version === 'v1' ? String(messageNumber) : 'GenAI'
    }_${this.lng}_${MOCKS.version}`;

    this.utm.campaignName = `${utm.campaignName}_${messageName.replace(/_/g, '-')}`;
    this.titleTemplate = MOCKS.titles[mainCampaign][iTitle];
    this.offerTemplate = MOCKS.offers[mainCampaign][iOffer];
    this.identity = `uuId-${store.storeId}-uuId`;
    // console.log('UTM PN: ', JSON.stringify(this.utm));
  }

  public setVariables(vars: TypeCampaignVariables): this {
    // console.log('this:', this, 'vars: ', vars);

    const extenalVars = this.generateClevertapExternalTriger(vars);
    for (const k in vars) {
      this.variablesValues[k] = extenalVars[k];
    }
    return this;
  }

  public setPaths(vars: TypeCampaignVariables): this {
    this.variablesValues.path = vars.path;
    return this;
  }

  public get integrationBody(): unknown {
    return {
      to: {
        identity: [this.identity],
      },
      campaign_id: this.campaignId,
      ExternalTrigger: this.variablesValues,
    };
  }

  private generateClevertapExternalTriger(
    obj: TypeCampaignVariables,
  ): TypeCampaignVariables {
    if (MOCKS.version === 'v2') {
      return {
        name: obj.name,
        title: obj.title ?? UTILS.replaceParams(this.titleTemplate, []),
        message:
          obj.message ??
          UTILS.replaceParams(this.offerTemplate, [
            obj.sku ?? '',
            obj.dsct ?? '',
          ]),
        //        path: obj.path,
      };
    }
    return {
      name: obj.name,
      title: UTILS.replaceParams(this.titleTemplate, []),
      message: UTILS.replaceParams(this.offerTemplate, [
        obj.sku ?? '',
        obj.dsct ?? '',
      ]),
      // path: obj.path,
    };
  }
}
