import {
  VertexAI,
  GenerativeModel,
  GenerationConfig,
  Content,
  TextPart,
  Part,
  GenerateContentResult,
} from '@google-cloud/vertexai';
import { Config } from '../config.ts';
import { LoggingProvider } from './logging.provider.ts';

export abstract class VertexAIClient {
  protected readonly maxRetries = 3;
  protected readonly vertexAI: VertexAI;
  protected readonly generativeModel: GenerativeModel;
  protected readonly generationConfig?: GenerationConfig;
  protected readonly systemInstruction: Content;
  protected readonly logger: LoggingProvider;

  constructor(
    systemInstruction: Content,
    generationConfig?: Partial<GenerationConfig>,
    loggingOptions?: { context?: string; levels?: string[] },
  ) {
    const { context = VertexAIClient.name, levels = [] } = loggingOptions || {};
    this.vertexAI = new VertexAI({
      project: Config.google.project,
      location: Config.google.location,
    });
    this.generativeModel = this.vertexAI.getGenerativeModel({
      model: Config.google.vertexAI.model,
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
    this.logger = new LoggingProvider({ context, levels });
    this.logger.log({
      message: 'Vertex AI client initialized',
      data: {
        systemInstruction: this.systemInstruction,
        generationConfig: this.generationConfig,
        model: Config.google.vertexAI.model,
        project: Config.google.project,
        location: Config.google.location,
      },
    });
  }

  public async predictContent(
    userInstructions: Content,
    retry = 1,
  ): Promise<Content | null> {
    try {
      const request = {
        contents: [userInstructions],
        generationConfig: this.generationConfig,
        systemInstruction: this.systemInstruction,
      };
      const { response } = await this.generativeModel.generateContent(request)
        .then((resp) => {
          this.logger.log({
            functionName: this.predictContent.name,
            message: 'Content generated successfully',
            data: { request:{ contents: request.contents, response: resp } },
          });
          return resp;
        })
        .catch((err) => {
          this.logger.error({
            functionName: this.predictContent.name,
            message: 'Error generating content',
            error: new Error(err as string),
            data: { retry, request }
          });
          throw err;
        }) as GenerateContentResult;
      const { candidates = [] } = response;
      return candidates[0]?.content || null;
    } catch (error) {
      if (retry >= this.maxRetries) throw error;
      return this.predictContent(userInstructions, retry + 1);
    }
  }
}

export const partFromText = (text: string): TextPart => ({
  text,
});

export const textFromParts = (part: Part[], i = 0): string =>
  (part[i]?.text || '').trim();
