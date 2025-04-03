import { IUtm } from '../integrations/interfaces.ts';
import { MessageService } from './message.service.ts';
import * as MOCKS from '../mocks/clevertap-campaigns.mock.ts';
import { TypeCampaignVariables, TypeStore } from '../types.ts';

const getRandomNumber = (n: number): number => Math.floor(Math.random() * n);

export class ClevertapMessageService extends MessageService {
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

    const iTitle = getRandomNumber(MOCKS.titles[mainCampaign].length);
    const iOffer = getRandomNumber(MOCKS.offers[mainCampaign].length);
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

    this.varValues = this.generateClevertapExternalTriger(vars);
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

  private generateClevertapExternalTriger(
    obj: TypeCampaignVariables,
  ): TypeCampaignVariables {
    if (MOCKS.version === 'v2') {
      return {
        name: obj.name,
        title: obj.title ?? this.replaceParams(this.titleTemplate, []),
        message:
          obj.message ??
          this.replaceParams(this.offerTemplate, [
            obj.sku ?? '',
            obj.dsct ?? '',
          ]),
        path: obj.path,
      };
    }
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
