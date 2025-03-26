import { IUtm } from '../integrations/interfaces.ts';
import { MessageService } from './message.service.ts';
import * as MOCKS from '../mocks/clevertap-campaigns.mock.ts';
import { TypeCampaignVariables, TypeStore } from '../types.ts';

const getRandomNumber = (n: number): number => Math.floor(Math.random() * n);

export class ClevertapMessageService extends MessageService {
  private readonly titleTemplate: string;
  private readonly offerTemplate: string;
  private readonly identity: string;

  constructor(store: TypeStore, campaignName: string, utm: IUtm) {
    const iTitle = getRandomNumber((MOCKS.titles[campaignName] ?? []).length);
    const iOffer = getRandomNumber((MOCKS.offers[campaignName] ?? []).length);
    const messageNumber = (iTitle + 1) * 100 + iOffer + 1;
    
    const [mainCampaign] = campaignName.split('.');

    const campaignId = MOCKS.campaignIds[mainCampaign] || mainCampaign;
    super(campaignId, messageNumber, utm);

    this.utm.campaignName = `${utm.campaignName}-${
      messageNumber
    }-${this.lng}-${MOCKS.version}`;
    this.titleTemplate = MOCKS.titles[mainCampaign][iTitle];
    this.offerTemplate = MOCKS.offers[mainCampaign][iOffer];
    this.identity = `uuId-${store.storeId}-uuId`;
  }

  public setVariables(vars: TypeCampaignVariables): this {
    this.varValues = this.generateConnectlyExternalTriger(vars);
    return this;
  }

  public get integrationBody(): unknown {
    return {
      to: {
        identity: [this.identity],
      },
      campaign_id: this.campaignId,
      ExternalTrigger: this.varValues,
    };
  }

  private generateConnectlyExternalTriger(
    obj: TypeCampaignVariables,
  ): TypeCampaignVariables {
    return {
      name: obj.name,
      title: this.replaceParams(this.titleTemplate, []),
      message: this.replaceParams(this.offerTemplate, [
        obj.sku ?? '',
        obj.dsct ?? '',
      ]),
      path: obj.path,
    };
  }

  private replaceParams(template: string, params: (string | number)[]): string {
    return params.reduce(
      (acc: string, param, i) => acc.replace(`{{${i}}}`, String(param)),
      template,
    );
  }
}
