import {
  VertexAI,
  GenerativeModel,
  GenerationConfig,
  Content,
  TextPart,
  Part,
} from '@google-cloud/vertexai';
import { Config } from '../config.ts';

export abstract class VertexAIClient {
  protected readonly vertexAI: VertexAI;
  protected readonly generativeModel: GenerativeModel;
  protected readonly generationConfig?: GenerationConfig;
  protected readonly systemInstruction: Content;

  constructor(
    systemInstruction: Content,
    generationConfig?: Partial<GenerationConfig>,
  ) {
    this.vertexAI = new VertexAI({
      project: Config.google.project,
      location: Config.google.location,
    });
    this.generativeModel = this.vertexAI.getGenerativeModel({
      model: Config.google.aiplatform.model,
    });
    this.systemInstruction = systemInstruction;
    this.generationConfig = {
      candidateCount: 1,
      maxOutputTokens: 512,
      temperature: 0.8,
      topP: 0.8,
      topK: 40,
      ...(generationConfig || {}),
    };
  }

  public async predictContent(
    userInstructions: Content,
  ): Promise<Content | null> {
    const resp = await this.generativeModel.generateContent({
      contents: [userInstructions],
      generationConfig: this.generationConfig,
      systemInstruction: this.systemInstruction,
    });
    const { candidates = [] } = resp.response;
    return candidates[0]?.content || null;
  }
}

export const partFromText = (text: string): TextPart => ({
  text,
});

export const textFromParts = (part: Part[], i = 0): string =>
  (part[i]?.text || '').trim();
