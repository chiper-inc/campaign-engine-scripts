// import { v1 } from '@google-cloud/aiplatform';
// import type { google } from '@google-cloud/aiplatform/build/protos';

// import { Config } from '../config.ts';

// /**
//  * Recursively extracts values from google.protobuf.Struct or google.protobuf.ListValue.
//  * @param value The google.protobuf.IValue object to extract data from.
//  * @returns The extracted value as a string, number, boolean, object, array, or null.
//  */
// export function fromIValue(value: google.protobuf.IValue | undefined): unknown {
//   if (!value) return null;

//   if (value.stringValue !== undefined) {
//     return value.stringValue;
//   } else if (value.numberValue !== undefined) {
//     return value.numberValue;
//   } else if (value.boolValue !== undefined) {
//     return value.boolValue;
//   } else if (value.structValue !== undefined) {
//     // Recursively process Struct
//     const result: Record<string, unknown> = {};
//     for (const [key, fieldValue] of Object.entries(value.structValue?.fields || {})) {
//       result[key] = fromIValue(fieldValue);
//     }
//     return result;
//   } else if (value.listValue !== undefined) {
//     // Recursively process List
//     return (value.listValue?.values || []).map((item) => fromIValue(item));
//   }

//   return null; // Return null if no value is found
// }

// /**
//  * Converts a JavaScript value into a google.protobuf.IValue.
//  * @param value The JavaScript value to convert.
//  * @returns The corresponding google.protobuf.IValue.
//  */
// export function toIValue(value: unknown): google.protobuf.IValue {
//   if (value === null || value === undefined) {
//     return { nullValue: google.protobuf.NullValue.NULL_VALUE };
//   } else if (typeof value === 'string') {
//     return { stringValue: value };
//   } else if (typeof value === 'number') {
//     return { numberValue: value };
//   } else if (typeof value === 'boolean') {
//     return { boolValue: value };
//   } else if (Array.isArray(value)) {
//     return {
//       listValue: {
//         values: value.map((item) => toIValue(item)),
//       },
//     };
//   } else if (typeof value === 'object') {
//     const fields: Record<string, google.protobuf.IValue> = {};
//     for (const [key, val] of Object.entries(value)) {
//       fields[key] = toIValue(val);
//     }
//     return {
//       structValue: {
//         fields,
//       },
//     };
//   }

//   throw new Error(`Unsupported value type: ${typeof value}`);
// }

// // Vertex AI client setup
// const { PredictionServiceClient } = v1;
// const client = new PredictionServiceClient();

// const PROJECT_ID = Config.google.project; // Replace with your GCP project ID
// const LOCATION = Config.google.location; // Replace with your region
// const MODEL_ID = Config.google.aiplatform.model; // Replace with the model ID you want to use

// /**
//  * Generates text using Vertex AI Generative AI.
//  * @param prompt The input prompt for the model.
//  * @param temperature The temperature for controlling randomness (default: 0.7).
//  * @param maxOutputTokens The maximum number of tokens in the output (default: 256).
//  * @returns The generated text.
//  */
// export async function generateText(
//   messages: { role: 'system' | 'user' | 'assistant'; content: string; }[],
//   temperature: number = 0.8,
//   maxOutputTokens: number = 2048,
// ): Promise<string> {
//   const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`;

//   const request: google.cloud.aiplatform.v1.IPredictRequest = {
//     endpoint,
//     instances: [
//       toIValue({ messages }),
//     ],
//     parameters: toIValue({
//       temperature,
//       maxOutputTokens,
//       topP: 0.8,
//       topK: 40
//     }),
//   };

//   try {
//     const [response] = await client.predict(request);
//     const predictions = response.predictions;

//     if (predictions && predictions.length > 0) {
//       return (fromIValue(predictions[0]) as {[k: string]: string}).content;
//     } else {
//       throw new Error('No predictions received from Vertex AI.');
//     }
//   } catch (error) {
//     console.error('Error generating text:', error);
//     throw error;
//   }
// }

// // Example usage:
// const text = await generateText([
//   { role: 'user', content: 'Hello!' },
//   { role: 'assistant', content: 'Hi there!' },
// ]);
// console.log('Generated text:', text);
