import { Content } from '@google-cloud/vertexai';
import { partFromText } from './vertex-ai.provider.ts';

export const systemInstruction: Content = {
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

export const userInstructionsConnectlyCarousel: Content = {
  parts: [
    partFromText(`
      A partir de un JSON que contiene los siguientes campos: 
      1) Parejas de las propiedades \`\`\`sku\`\`\`, \`\`\`dsct\`\`\` de \`\`\`1\`\`\` al \`\`\`8\`\`\` 
      para los producto a promocionar y su respectivo 'descuento'.
      Las propiedad \`\`\`sku\`\`\` incluye las secuencia \`\`\` - \`\`\` que separan 
      la 'descripción', la 'marca' y la 'presentación' del 'producto', es ese orden.
    `),
    partFromText(`
      Cree una mensaje promocional de Chiper hacia el comerciante mediante un 'Whatsapp'
      por un mensaje para cada 'producto'.

      El mensaje para cada 'producto' en la 'Whatapp' debe ser una frase con máximo 20 palabras. 
      la frase debe ser una redacción mejorada con la combinación de: 
      'descripción', 'marca', 'presentación' y el 'descuento' correspondiente en forma promocional para la 
      comercialización por parte del comerciante, debe estar precedido por un emoji relacionado al 'producto', y 
      la información del 'descuento' debe ir entre \`\`\`*\`\`\` (Bolded in markdown).
    `),
    // partFromText(`
    //   Se debe generar 1 'titulo' por cada 2 'productos' en la 'PushNotification'.
    // `),
    partFromText(`
      Generar la respuesta en formato JSON con la siguiente propiedad:
      a) \`\`\`products\`\`\` (array de strings con los mensajes de cada 'producto')
      La respuesta debe incluir exclusivamente el JSON, sin ningún otro texto.
    `),
  ],
  role: 'user',
};

export const userInstructionsClevertapPushNotification: Content = {
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
      comercialización por parte del comerciante, y debe estar precedido por un emoji relacionado al 'producto'
      
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
