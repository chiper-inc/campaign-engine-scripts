import { Content } from '@google-cloud/vertexai';
import {
  VertexAIClient,
  partFromText,
  textFromParts,
} from './vertex-ai.provider.ts';
import { TypeCampaignVariables } from '../types.ts';
import * as PROMPTS from './vertex-ai.promtps.ts';
import { STORE_STATUS } from '../enums.ts';
import * as MOCKS from '../mocks/connectly-greetings.mock.ts';
import * as UTILS from '../utils/index.ts';

export class ConnectlyCarouselNotificationAI extends VertexAIClient {
  private static instance: ConnectlyCarouselNotificationAI | null = null;
  private readonly userInstructions: Content;

  private constructor() {
    super(
      PROMPTS.systemInstruction, 
      { maxOutputTokens: 1024, temperature: 1.0 },
      { context: ConnectlyCarouselNotificationAI.name }
    );
    this.userInstructions = PROMPTS.userInstructionsConnectlyCarousel;
    this.logger.log({
      message: 'ConnectlyCarouselNotificationAI initialized',
      data: { userInstructions: this.userInstructions },
    });
  }

  public static getInstance(): ConnectlyCarouselNotificationAI {
    if (!ConnectlyCarouselNotificationAI.instance) {
      ConnectlyCarouselNotificationAI.instance =
        new ConnectlyCarouselNotificationAI();
    }
    return ConnectlyCarouselNotificationAI.instance;
  }

  public async generateContent(
    variables: TypeCampaignVariables,
    retry: number = 1,
  ): Promise<{ greeting: string; products: string[] } | null> {
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
      // Temporarily remove the greeting logic
      const greetings =
        MOCKS.GREETINGS[variables.sgmt as STORE_STATUS] ||
        MOCKS.GREETINGS[STORE_STATUS._default];
      const greetingTemplate =
        greetings[UTILS.getRandomNumber(greetings.length)];

      const greeting = UTILS.replaceParams(greetingTemplate, [variables.name]);

      const parsedJson = JSON.parse(outputJsonText) as { products: string[] };
      return { greeting, ...parsedJson };
    } catch (error) {
      this.logger.error({
        functionName: this.generateContent.name,
        message: 'Error parsing JSON response',
        error: new Error(error as string),
        data: { retry, inputJson, outputJsonText },
      });
      if (retry >= this.maxRetries) throw new Error('Error parsing JSON');

      return this.generateContent(variables, retry + 1);
    }
  }
}
