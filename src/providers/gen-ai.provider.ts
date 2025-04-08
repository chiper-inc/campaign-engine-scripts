import { Config } from '../config.ts';
import { IPreEntry } from '../scripts/interfaces.ts';
import { LoggingProvider, LoggingLevel } from './logging.provider.ts';

export class GenAiProvider {
  private readonly logger: LoggingProvider;
  private readonly BATCH_SIZE = Config.google.vertexAI.bacthSize;

  constructor() {
    this.logger = new LoggingProvider({
      context: GenAiProvider.name,
      levels: LoggingLevel.NONE, // LoggingLevel.WARN | LoggingLevel.ERROR,
    });
  }

  public async generateCampaignMessages(
    preEntries: IPreEntry[],
  ): Promise<number[]> {
    const functionName = this.generateCampaignMessages.name;

    let i = 0;
    const n = Math.ceil(preEntries.length / this.BATCH_SIZE);
    const promises: Promise<unknown>[] = [];
    this.logger.warn({
      message: `Start Generating AI Messages ${preEntries.length} in ${n} batches of ${this.BATCH_SIZE}`,
      functionName,
      data: {
        batchSize: this.BATCH_SIZE,
        n,
        preEntriesLength: preEntries.length,
      },
    });

    const storeSet = new Set<number>();
    for (const preEntry of preEntries) {
      if (promises.length >= this.BATCH_SIZE) {
        await Promise.all(promises);
        this.logger.warn({
          message: `batch ${++i} of ${n}, for GenAI done`,
          functionName,
        });
        console.log(`batch ${i} of ${n}, for GenAI done`);
        promises.length = 0;
      }
      promises.push(
        preEntry.campaignService
          ? preEntry.campaignService
              .setMessagesVariables()
              .catch(() => storeSet.add(preEntry.storeId))
          : Promise.resolve(),
      );
    }
    if (promises.length) {
      await Promise.all(promises);
      this.logger.warn({
        message: `batch ${++i} of ${n}, for GenAI done`,
        functionName,
      });
      console.log(`batch ${i} of ${n}, for GenAI done`);
    }
    this.logger.warn({
      message: `End Generating AI Messages`,
      functionName,
    });
    console.log({ storeSet });
    return Array.from(storeSet);
  }
}
