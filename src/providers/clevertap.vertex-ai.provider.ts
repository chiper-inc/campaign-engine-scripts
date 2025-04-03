import { Content } from '@google-cloud/vertexai';
import {
  VertexAIClient,
  partFromText,
  textFromParts,
} from './vertex-ai.provider.ts';
import { TypeCampaignVariables } from '../types.ts';

const systemInstruction: Content = {
  parts: [
    partFromText(`
      Usted es un creativo de marketing, que trabaja para un marketplace llamado Chiper.
      Chiper vende productos de consumo masivo para comerciantes independientes.
    `),
    partFromText(`
      Su labor es generar frases que el comerciante lea rapidamente, 
      para encontrar mas facilmente los productos que busca en el marketplace.
    `),
    partFromText(`
      Debe usar un lenguaje casual y directo, evitando tecnisismos.
      Debe evitar el uso de términos en Ingles,
    `),
  ],
  role: 'system',
};

const userInstructions: Content = {
  parts: [
    partFromText(`
      A partir de un JSON que contiene los siguientes campos: 
      1) Nombre de comerciante independiete en la propiedad \`\`\`name\`\`\`
      2) Parejas de las propiedades \`\`\`sku\`\`\`, \`\`\`dsct\`\`\` de \`\`\`1\`\`\` al \`\`\`8\`\`\` 
      para los producto a promocionar y su respectivo 'descuento'.
      Las propiedad \`\`\`sku\`\`\` incluye las secuencia \`\`\` - \`\`\` que separan 
      la 'descripción', la 'marca' y la 'presentación' del producto, es ese orden.
    `),
    partFromText(`
      Cree una mensaje promocional de Chiper hacia el comerciante mediante una PushNofication, 
      compuesta por un 'título' y un mensaje para cada 'producto'.

      El mensaje para cada 'producto' en la 'PushNotification' debe ser una frase con máximo 20 palabras. 
      la frase debe ser una redacción mejorada con la combinación de: 
      'descripción', 'marca', 'presentación' y el 'descuento' correspondiente en forma promocional para la 
      reventa por parte del comerciante, y debe estar precedido por un emoji relacionado al 'producto'.
      
      El 'título' de la 'PushNotification' debe ser un frase promocional de maximmo 6 palabras,
      que invitan al comerciante a aprovechar la oferta, y debe estar acompañado por un emoji relacionado al título. 
      El nombre del comerciante puede ser usado eventualmente en el título.
    `),
    // partFromText(`
    //   Se debe generar 1 'titulo' por cada 2 'productos' en la 'PushNotification'.
    // `),
    partFromText(`
      Generar la respuesta en formato JSON con las siguientes propiedades:
      a) \`\`\`titles\`\`\` (array de strings con los 'títulos')
      b) \`\`\`products\`\`\` (array de strings con los mensajes de cada 'producto')
      La respuesta debe incluir exclusivamente el JSON, sin ningún otro texto.
    `),
  ],
  role: 'user',
};

export class ClevertapPushNotificationAI extends VertexAIClient {
  private static instance: ClevertapPushNotificationAI | null = null;
  private readonly userInstructions: Content;

  private constructor() {
    super(systemInstruction, { maxOutputTokens: 1024, temperature: 1.0 });
    this.userInstructions = userInstructions;
  }

  public static getInstance(): ClevertapPushNotificationAI {
    if (!ClevertapPushNotificationAI.instance) {
      ClevertapPushNotificationAI.instance = new ClevertapPushNotificationAI();
    }
    return ClevertapPushNotificationAI.instance;
  }

  public async generateContent(
    variables: TypeCampaignVariables,
    retry: number = 1,
  ): Promise<TypeCampaignVariables | null> {
    if (!variables || !variables.name) return null;

    const inputJson = JSON.stringify(variables);
    const { parts, role } = this.userInstructions;
    const responseContent = await this.predictContent({
      parts: [...parts, partFromText(`JSON: \`\`\`${inputJson}\`\`\``)],
      role,
    });
    if (responseContent === null) return null;
    const outputJsonText = textFromParts(responseContent?.parts)
      .replace(/^```json/g, '')
      .replace(/```$/g, '');
    try {
      return JSON.parse(outputJsonText) as TypeCampaignVariables;
    } catch (error) {
      console.error(
        `Error parsing JSON (Retry = ${retry}):`,
        error,
        inputJson,
        outputJsonText,
      );
      if (retry >= this.maxRetries) throw new Error('Error parsing JSON');

      return this.generateContent(variables, retry + 1);
    }
  }
}
