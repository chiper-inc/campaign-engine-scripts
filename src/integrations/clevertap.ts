import { CloudTask } from './cloud-task.ts';

import { Config } from '../config.ts';
import { IClevertapCampaign, IClevertapMessage } from './interfaces.ts';

export class ClevertapIntegration {
  private readonly url: string;
  private readonly headers: { [key: string]: string };
  private readonly backoffSecondsStep: number;

  constructor() {
    this.url = Config.clevertap.apiUrl;
    this.headers = {
      'X-CleverTap-Account-Id': Config.clevertap.accountId,
      'X-CleverTap-Passcode': Config.clevertap.passcode,
      'Content-Type': 'application/json',
    };
    this.backoffSecondsStep = Config.environment === 'production' ? 3600 /* 60m */ : 15 /* 15s */;
  }

  public async sendOneCampaign({
    message,
    inSeconds,
    timeoutSeconds,
  }: IClevertapCampaign): Promise<void> {
    const method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST';
    const request = {
      url: `${this.url}/1/send/externaltrigger.json`,
      method,
      headers: {
        'X-CleverTap-Account-Id': Config.clevertap.accountId,
        'X-CleverTap-Passcode': Config.clevertap.passcode,
        'Content-Type': 'application/json',
      },
      body: message,
    };
    const cloudTask = new CloudTask('Campaign-Engine-Communication');
    const name = `Clevertap-Campaign-${message.campaign_id}`;
    await cloudTask.createOneTask({
      name,
      request,
      inSeconds,
      timeoutSeconds,
    }).catch((error) => {
      console.error('Rejection: ', JSON.stringify({ name, request, inSeconds, timeoutSeconds }));
      console.error('Error:', error);
    });
    // console.log(`Created task ${response.name}`);
  }

  async sendAllMessages(messages: IClevertapMessage[]): Promise<void> {
    const promises = [];
    let inSeconds = 0;
    let k = -1;
    for (const message of messages) {
      inSeconds += Math.floor(Math.pow(2, k)) * this.backoffSecondsStep;
      k++;
      promises.push(this.sendOneCampaign({ 
        message: message,
        inSeconds: inSeconds,
      }));
    }
    await Promise.all(promises);
  }
}

// const ci = new ClevertapIntegration();
// ci.sendAllCampaigns([
//   {
//     campaignId: '1742415258',
//     identities: ['uuId-155666-uuId'],
//     variables: {
//       title: '1.2% de ganancia en tu compra 🎯',
//       offer:
//         'Vende más con 🛒 Cereal Edicion Barbie - Kellogg´s - Paquete 75 g. ¡Tu competencia ya lo tiene!⚡',
//       path: 'www.google.com',
//       image:
//         'https://chiper-old-imgs.imgix.net/app/7702404005034-HkP4mupji-R.png?w=800&h=400&fit=fill&bg=white',
//     },
//   },
//   {
//     campaignId: '1742415258',
//     identities: ['uuId-155666-uuId'],
//     variables: {
//       title: 'Tu oferta 2.5% de dcto te espera 🏆',
//       offer:
//         '💡 Gana clientes con Aceite Vegetal de Soya De Primera - DE PRIMERA - Cuñete 18 l. ¡Haz tu pedido ahora!🏪',
//       path: 'www.google.com',
//       image:
//         'https://chiper-old-imgs.imgix.net/app/7702535011706-H1cEmdajo-R.png?w=800&h=400&fit=fill&bg=white',
//     },
//   },
//   {
//     campaignId: '1742415258',
//     identities: ['uuId-155666-uuId'],
//     variables: {
//       name: 'John Doe',
//       title: '🔖 Aprovecha 2% de descuento',
//       offer:
//         '💥 Gaseosa De Toronja - Quatro - Botella pet 400 ml. 🛒 No la dejes pasar.',
//       path: 'https://tienda.chiper.co/pedir/seccion/descuentos?utm_campaign=jasj&utm_term=102002',
//     },
//   },
//   {
//     campaignId: '1742415258',
//     identities: ['uuId-155666-uuId'],
//     variables: {
//       name: 'John Doe',
//       title: '📣 Imperdible 1% dcto',
//       offer:
//         '😱 Aprovechalo ya! 👉 Alimento Para Perros Medianos Y Grandes Dog Chow Sin Colorantes X 22.7Kg - Dog Chow - Bulto 22 kg. 🛍️',
//       path: 'https://tienda.chiper.co/pedir/seccion/descuentos?utm_campaign=jasj&utm_term=102002',
//     },
//   },
// ])
//   .then(() => console.log('Done!'))
//   .catch((error) => console.error('ERROR:', error));
