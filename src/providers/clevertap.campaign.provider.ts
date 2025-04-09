import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm, ICallToActionLink } from './interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { ClevertapMessageProvider } from './clevertap.message.provider.ts';
import { ClevertapPushNotificationAI } from './clevertap.vertex-ai.provider.ts';
import * as MOCKS from '../mocks/clevertap-campaigns.mock.ts';
import { OFFER_TYPE } from '../repositories/interfaces.ts';

export class ClevertapCampaignProvider extends CampaignProvider {
  constructor(
    store: TypeStore,
    campaignName: string,
    variables: TypeCampaignVariables,
    utm: IUtm,
    lng: string,
  ) {
    super(variables, lng);
    const n = MOCKS.maxMessagesPerCampaign;
    for (let i = 1; i <= n && variables[`sku_${i}`]; i++) {
      this.messageValues.push(
        new ClevertapMessageProvider(store, campaignName, utm),
      );
    }
  }

  public setPathVariables(shortLinks: ICallToActionLink[]): this {
    const paths: string[] = [];
    for (const variable in this.variableValues) {
      if (variable.startsWith('path')) {
        paths.push(variable);
      }
    }

    paths.forEach((path, i) => {
      const shortLink = this.getPathVariable(
        shortLinks[i].fullUrl ?? `https://tienda.chiper.co/shortlink_${i + 1}`,
      );
      this.variableValues[path] = shortLink;
      this.messageValues[i].setPaths({ path: this.variableValues[path] });
    });

    return this;
  }

  private getPathVariable(url: string): string {
    return url;
  }

  public async setMessagesVariables(): Promise<this> {
    const pushNotificationGenerator = ClevertapPushNotificationAI.getInstance();

    // if (this.variables.path_4) {
    //   throw new Error('Path_4 is not allowed');
    // }

    const pushNotificationContent =
      (await pushNotificationGenerator.generateContent(
        this.variableValues,
      )) as unknown as { titles: string[]; products: string[] };

    const splitedVars = this.splitVariables(this.variables);
    this.mergeVariablesTitleAndProduct(
      splitedVars,
      pushNotificationContent.titles,
      pushNotificationContent.products,
    );

    this.messageValues.forEach((message, index) => {
      message.setVariables(splitedVars[index]);
    });
    return Promise.resolve(this);
  }

  private mergeVariablesTitleAndProduct(
    variables: TypeCampaignVariables[],
    titles: string[],
    products: string[],
  ): void {
    const getTitle = (titles: string[], i: number): string =>
      titles[i % titles.length];

    const getProductMessage = (products: string[], i: number): string =>
      products[i % products.length];

    variables.forEach((variable, i) => {
      variable.title = getTitle(titles, i);
      variable.message =
        this.variableValues[`type_${i + 1}`] === OFFER_TYPE.storeReference
          ? getProductMessage(products, i)
          : this.getPromotionMessage(
              String(this.variableValues[`sku_${i + 1}`]),
            );
    });
  }

  private splitVariables(
    variables: TypeCampaignVariables,
  ): TypeCampaignVariables[] {
    const map = new Map<number, TypeCampaignVariables>();
    const common: TypeCampaignVariables = {};
    for (const [k, value] of Object.entries(variables)) {
      const [key, index] = k.split('_');
      if (!index) {
        common[key] = value;
        continue;
      }

      const i = Number(index);
      if (Number.isNaN(i)) continue;

      const obj: TypeCampaignVariables = map.get(i) || {};
      if (['img'].includes(key)) {
        obj[key] = value;
      }
      map.set(i, obj);
    }
    return Array.from(map.entries()).map(([, value]) => ({
      ...common,
      ...value,
    }));
  }

  public getMessageName(): string {
    return MOCKS.version === 'v2' ? 'GenAI' : 'Random';
  }
}
