import { Content } from '@google-cloud/vertexai';
import { VertexAIClient, partFromText, textFromParts } from './vertex-ai.ts';
import { TypeCampaignVariables } from '../types.ts';

const systemInstruction: Content = {
  parts: [
    partFromText(`
      Usted es un creativo de marketing, que trabaja para un marketplace llamado Chiper.
      Chiper vende productos de consumo masivo para comerciantes independientes.
    `),
    partFromText(`
      Su labor es generar frases que el comerciante lea rapidamente, 
      para encontrar mas facilmente los productos que busca.
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
      Cree una mensaje promocional hacia de Chiper hacia el comerciante mediante una PushNofication.
      Cada 'PushNotification' debe incluir un 'título' y 2 'productos'.

      El mensaje para cada 'producto' en la 'PushNotification' debe ser una frase con máximo 15 palabras. 
      la frase debe ser una redacción mejorada con la combinación de: 
      'descripción', 'marca', 'presentación' y el 'descuento' correspondiente en forma promocional para la 
      reventa por parte del comerciante, y debe estar precedido por un emoji relacionado al 'producto'.
      
      El 'título' de la 'PushNotification' debe ser un frase promocional de maximmo 6 palabras,
      que invitan al comerciante a aprovechar la oferta, y debe estar acomapañado por un emoji relacionado al título. 
      El nombre del comerciante puede ser usado eventualemente en el título.
    `),
    partFromText(`
      Generar la respuesta en formato JSON con 2 propiedades:
      1) \`\`\`titles\`\`\` (array de strings con los 'títulos')
      2) \`\`\`products\`\`\` (array de strings con los mensajes de cada 'producto')
      La respuesta debe incluir exclusivamente el JSON, sin ningun otro texto.
    `),
  ],
  role: 'user',
};

export class ClevertapPushNotificationAI extends VertexAIClient {
  private readonly userInstructions: Content;

  constructor() {
    super(systemInstruction, { maxOutputTokens: 1024, temperature: 1.0 });
    this.userInstructions = userInstructions;
  }

  public async generateContent(
    variables: TypeCampaignVariables,
  ): Promise<TypeCampaignVariables | null> {
    if (!variables || !variables.name) return null;

    let json = JSON.stringify(variables);
    const { parts, role } = this.userInstructions;
    const responseContent = await this.predictContent({
      parts: [...parts, partFromText(`JSON: \`\`\`${json}\`\`\``)],
      role,
    });
    if (responseContent === null) return null;
    console.log(`Response: ${JSON.stringify(responseContent, null, 2)}`);
    json = textFromParts(responseContent?.parts)
      .replace(/^```json/g, '')
      .replace(/```$/g, '');
    return JSON.parse(json) as TypeCampaignVariables;
  }
}
