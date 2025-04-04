import { Content } from '@google-cloud/vertexai';
import * as VERTEX_AI from './vertex-ai.provider.ts';
import { TypeCampaignVariables } from '../types.ts';
import * as PROMPTS from './vertex-ai.promtps.ts';

export class ClevertapPushNotificationAI extends VERTEX_AI.VertexAIClient {
  private static instance: ClevertapPushNotificationAI | null = null;
  private readonly userInstructions: Content;

  private constructor() {
    super(
      PROMPTS.systemInstruction, 
      { maxOutputTokens: 1024, temperature: 1.0 },
      { context: ClevertapPushNotificationAI.name },
    );
    this.userInstructions = PROMPTS.userInstructionsClevertapPushNotification;
    this.logger.log({
      message: 'ClevertapPushNotificationAI initialized',
      data: { userInstructions: this.userInstructions },
    });
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
      parts: [
        ...parts,
        VERTEX_AI.partFromText(`JSON: \`\`\`${inputJson}\`\`\``),
      ],
      role,
    });
    if (responseContent === null) return null;
    const outputJsonText = VERTEX_AI.textFromParts(responseContent?.parts)
      .replace(/^```json/g, '')
      .replace(/```$/g, '');
    try {
      return JSON.parse(outputJsonText) as TypeCampaignVariables;
    } catch (error) {
      this.logger.error({
        functionName: this.generateContent.name,
        message: 'Error parsing JSON response',
        error: new Error(error as string),
        data: { retry, inputJson, outputJsonText },
      });
      if (retry >= this.maxRetries) throw new Error(error as string);

      return this.generateContent(variables, retry + 1);
    }
  }
}
