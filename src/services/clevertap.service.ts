import { TypeCampaignVariables } from '../types.ts';
import * as MOCKS from '../mocks/clevertap-campaigns.mock.ts';
export class ClevertapService {
  constructor() {}

  public xxx(variables: TypeCampaignVariables): TypeCampaignVariables[] {
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
      .map(([, value]) => ({ ...common, ...value }))
      .map(this.generateConnectlyExternalTriger.bind(this));
  }

  private generateConnectlyExternalTriger(
    obj: TypeCampaignVariables,
  ): TypeCampaignVariables {
    const titleTemplate = this.getRandomValue(MOCKS.titles);
    const offerTemplace = this.getRandomValue(MOCKS.offers);
    return {
      title: this.replaceParams(titleTemplate, [obj.dsct ?? '']),
      offer: this.replaceParams(offerTemplace, [obj.sku ?? '']),
      path: obj.path,
      image: obj.img,
    };
  }

  private replaceParams(template: string, params: (string | number)[]): string {
    return params.reduce(
      (acc: string, param, i) => acc.replace(`{{${i}}}`, String(param)),
      template,
    );
  }

  private getRandomValue<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
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
