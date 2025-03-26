import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { CampaignService } from './campaign.service.ts';
import { ClevertapMessageService } from './clevertap.message.service.ts';
import { ICallToActionLink } from '../main.ts';

export class ClevertapCampaignService extends CampaignService {
  constructor(
    store: TypeStore,
    campaignName: string,
    varibales: TypeCampaignVariables,
    utm: IUtm,
    lng: string,
  ) {
    super(varibales, lng);
    for (let i = 0; i < 3; i++) {
      this.messageValues.push(
        new ClevertapMessageService(store, campaignName, utm),
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
    });

    return this;
  }

  private getPathVariable(url: string): string {
    return url;
  }

  public setMessagesVariables(): this {
    const splitedVars = this.splitVariables(this.variables);
    this.messageValues.forEach((message, index) => {
      message.setVariables(splitedVars[index]);
    });
    return this;
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
      obj[key] = value;
      map.set(i, obj);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([, value]) => ({ ...common, ...value }));
  }
}

// const x = new ClevertapService();
// console.log(x.xxx({
//   name: 'John Doe', path: "www.google.com",
//   sku_1: 'Cereal Edicion Barbie - Kellogg´s - Paquete 75 g',
//   dsct_1: '1.2%',
//   name_2: 'name2',
//   sku_2: 'Aceite Vegetal de Soya De Primera - DE PRIMERA - Cuñete 18 l',
//   dsct_2: '2.5%',
//   img_1: 'https://chiper-old-imgs.imgix.net/app/7702404005034-HkP4mupji-R.png?w=800&h=400&fit=fill&bg=white',
//   img_2: 'https://chiper-old-imgs.imgix.net/app/7702535011706-H1cEmdajo-R.png?w=800&h=400&fit=fill&bg=white',
// }));
