import { Content } from '@google-cloud/vertexai';
import {
  VertexAIClient,
  partFromText,
  textFromParts,
} from './vertex-ai.provider.ts';
import { TypeCampaignVariables } from '../types.ts';
import * as PROMPTS from './vertex-ai.promtps.ts';

export class ConnectlyCarouselNotificationAI extends VertexAIClient {
  private static instance: ConnectlyCarouselNotificationAI | null = null;
  private readonly userInstructions: Content;

  private constructor() {
    super(PROMPTS.systemInstruction, { maxOutputTokens: 1024, temperature: 1.0 });
    this.userInstructions = PROMPTS.userInstructionsConnectlyCarousel;
  }

  public static getInstance(): ConnectlyCarouselNotificationAI {
    if (!ConnectlyCarouselNotificationAI.instance) {
      ConnectlyCarouselNotificationAI.instance = new ConnectlyCarouselNotificationAI();
    }
    return ConnectlyCarouselNotificationAI.instance;
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
