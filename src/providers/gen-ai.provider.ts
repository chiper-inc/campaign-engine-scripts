import { Config } from '../config.ts';
import { ICommunication } from './interfaces.ts';
import { LoggingProvider, LoggingLevel } from './logging.provider.ts';

export class GenAiProvider {
  private readonly logger: LoggingProvider;
  private readonly BATCH_SIZE = Config.google.vertexAI.bacthSize;

  constructor() {
    this.logger = new LoggingProvider({
      context: GenAiProvider.name,
      levels: LoggingLevel.WARN | LoggingLevel.ERROR,
    });
  }

  public async generateCampaignMessages(
    communications: ICommunication[],
  ): Promise<number[]> {
    const functionName = this.generateCampaignMessages.name;

    let i = 0;
    const n = Math.ceil(communications.length / this.BATCH_SIZE);
    const promises: Promise<unknown>[] = [];
    this.logger.warn({
      message: `Start Generating AI Messages ${communications.length} in ${n} batches of ${this.BATCH_SIZE}`,
      functionName,
      data: {
        batchSize: this.BATCH_SIZE,
        n,
        communicationsLength: communications.length,
      },
    });

    const storeSet = new Set<number>();
    for (const communication of communications) {
      if (promises.length >= this.BATCH_SIZE) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++i} of ${n}, for GenAI done`,
          functionName,
        });
        promises.length = 0;
      }
      promises.push(
        communication.campaignService
          ? communication.campaignService
              .setMessagesVariables()
              .catch((error) => {
                this.logger.error({
                  message: 'Error Generating AI messages',
                  functionName,
                  error: error as Error,
                  data: {
                    storeId: communication.storeId,
                    variables: communication.campaignService?.variables,
                  },
                });
                storeSet.add(communication.storeId);
              })
          : Promise.resolve(),
      );
    }
    if (promises.length) {
      await Promise.all(promises);
      this.logger.warn({
        message: `batch ${++i} of ${n}, for GenAI done`,
        functionName,
      });
    }
    this.logger.warn({
      message: `End Generating AI Messages`,
      functionName,
    });
    return Array.from(storeSet);
  }
}
