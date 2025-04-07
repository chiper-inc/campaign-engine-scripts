import { Config } from '../config.ts';
import { IPreEntry } from '../scripts/interfaces.ts';
import { LoggingProvider, LoggingLevel } from './logging.provider.ts';

export class GenAiProvider {
  private readonly logger: LoggingProvider;

  constructor() {
    this.logger = new LoggingProvider({
      context: GenAiProvider.name,
      levels: LoggingLevel.WARN | LoggingLevel.ERROR,
    });
  }

  public async generateCampaignMessages(
    preEntries: IPreEntry[],
  ): Promise<void> {
    const functionName = this.generateCampaignMessages.name;

    let i = 0;
    const BATCH_SIZE = Config.google.vertexAI.bacthSize;
    const n = Math.ceil(preEntries.length / BATCH_SIZE);
    const promises: Promise<unknown>[] = [];
    this.logger.warn({
      message: `Start Generating AI Messages ${preEntries.length} in ${n} batches of ${BATCH_SIZE}`,
      functionName,
      data: { batchSize: BATCH_SIZE, n, preEntriesLength: preEntries.length },
    });
    for (const preEntry of preEntries) {
      if (promises.length >= BATCH_SIZE) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++i} of ${n}, for GenAI done!`,
          functionName,
        });
        promises.length = 0;
      }
      promises.push(
        preEntry.campaignService
          ? preEntry.campaignService.setMessagesVariables()
          : Promise.resolve(),
      );
    }
    if (promises.length) {
      await Promise.all(promises);
      this.logger.warn({
        message: `batch ${++i} of ${n}, for GenAI done!`,
        functionName,
      });
    }
    this.logger.warn({
      message: `End Generating AI Messages`,
      functionName,
    });
  }
}
