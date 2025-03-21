import { CloudTask } from "./cloud-task.ts";

import { Config } from '../config.ts';
import { IClevertapCampaign } from './interfaces.ts';

export class ClevertapIntegration {
  private readonly url: string;
  private readonly headers: { [key: string]: string };
  private readonly backoffSecondsStep: number;

  constructor() {
    this.url = 'https://us1.api.clevertap.com';
    this.headers = {
      'X-CleverTap-Account-Id': Config.clevertap.accountId,
      'X-CleverTap-Passcode': Config.clevertap.passcode,
      'Content-Type': 'application/json',
    };
    this.backoffSecondsStep = Config.environment === 'production' ? 450 : 15;
}

  public async sendOneCampaign({
    campaignId, 
    variables,
    inSeconds,
    timeoutSeconds,
    storeIds,
  }: { 
    campaignId: string;
    storeIds: number[];
    variables: { [key: string]: string | number },
    inSeconds?: number,
    timeoutSeconds?: number,
   }): Promise<void> {

    const method: ('POST' | 'GET' | 'PUT' | 'DELETE') = 'POST';
    const request = {
      url: `${this.url}/1/send/externaltrigger.json`,
      method,
      headers: {
        'X-CleverTap-Account-Id': Config.clevertap.accountId,
        'X-CleverTap-Passcode': Config.clevertap.passcode,
        'Content-Type': 'application/json',
      },
      body: {
        to: { 
          identity: storeIds.map((storeId) => (`uuId-${storeId}-uuId`)),
        },
        campaign_id: campaignId,
        ExternalTrigger: variables,
      }
    }
    const cloudTask= new CloudTask('Campaign-Engine-Communication');
    const response = await cloudTask.createOneTask({ 
      name: `Clevertap-Campaign-${campaignId}`,
      request, inSeconds, timeoutSeconds
    });
    console.log(`Created task ${response.name}`);
  }

  async sendAllCampaigns(campaigns: IClevertapCampaign[]): Promise<void> {
    const promises = [];
    let inSeconds = 0;
    let k = -1;
    for (const campaign of campaigns) {
      inSeconds = campaign.inSeconds ?? (inSeconds + Math.floor(Math.pow(2, k)) * this.backoffSecondsStep);
      console.log('Sending campaign in', inSeconds, 'seconds');
      k++;
      promises.push(this.sendOneCampaign({...campaign, inSeconds }));
    }
    await Promise.all(promises);
  }
}

const ci = new ClevertapIntegration();
ci.sendAllCampaigns([
  {
    campaignId: '1742415258',
    storeIds: [155666],
    variables: {
      title: '1.2% de ganancia en tu compra 🎯',
      offer: 'Vende más con 🛒 Cereal Edicion Barbie - Kellogg´s - Paquete 75 g. ¡Tu competencia ya lo tiene!⚡',
      path: 'www.google.com',
      image: 'https://chiper-old-imgs.imgix.net/app/7702404005034-HkP4mupji-R.png?w=800&h=400&fit=fill&bg=white'
    },
  }, {
    campaignId: '1742415258',
    storeIds: [155666],
    variables: {
      title: 'Tu oferta 2.5% de dcto te espera 🏆',
      offer: '💡 Gana clientes con Aceite Vegetal de Soya De Primera - DE PRIMERA - Cuñete 18 l. ¡Haz tu pedido ahora!🏪',
      path: 'www.google.com',
      image: 'https://chiper-old-imgs.imgix.net/app/7702535011706-H1cEmdajo-R.png?w=800&h=400&fit=fill&bg=white'
    },
  },
  {
    campaignId: '1742415258',
    storeIds: [155666],
    variables: {
      name: 'John Doe',
      title: '🔖 Aprovecha 2% de descuento',
      offer: '💥 Gaseosa De Toronja - Quatro - Botella pet 400 ml. 🛒 No la dejes pasar.',
      path: 'https://tienda.chiper.co/pedir/seccion/descuentos?utm_campaign=jasj&utm_term=102002'
    },
  }, {
    campaignId: '1742415258',
    storeIds: [155666],
    variables: {
      name: 'John Doe',
      title: '📣 Imperdible 1% dcto',
      offer: '😱 Aprovechalo ya! 👉 Alimento Para Perros Medianos Y Grandes Dog Chow Sin Colorantes X 22.7Kg - Dog Chow - Bulto 22 kg. 🛍️',
      path: 'https://tienda.chiper.co/pedir/seccion/descuentos?utm_campaign=jasj&utm_term=102002'
    },
  }
]).then(() => console.log('Done!')).catch((error) => console.error('ERROR:', error));