import { Logger } from 'logging-chiper';
import { Config } from '../config.ts';

interface LogInput {
  readonly stt: string;
  readonly message: string;
  readonly context?: string;
  readonly functionName?: string;
  readonly data?: unknown;
}

interface ErrorInput {
  readonly stt: string;
  readonly message: string;
  readonly error: Error;
  readonly context?: string;
  readonly functionName?: string;
  readonly data?: unknown;
}

export enum LoggingLevel {
  NONE = 0,
  LOG = 4,
  WARN = 2,
  ERROR = 1,
  FULL = 7,
}

export class LoggingProvider {
  private readonly loggerBaseData: Partial<LogInput>;
  private readonly level: LoggingLevel = Config.logging
    .level as unknown as LoggingLevel;

  constructor(loggingOptions?: { context?: string; levels?: LoggingLevel }) {
    const { context = LoggingProvider.name, levels = LoggingLevel.NONE } =
      loggingOptions || {};
    this.level = levels !== LoggingLevel.NONE ? levels : this.level;
    this.loggerBaseData = {
      stt: 'campaign-engine',
      context,
    };
  }

  public log(input: Partial<LogInput>) {
    if (this.level & LoggingLevel.LOG) {
      Logger.getInstance().log({
        ...this.loggerBaseData,
        ...input,
      } as LogInput);
    }
  }

  public error(input: Partial<ErrorInput>) {
    if (this.level & LoggingLevel.ERROR) {
      Logger.getInstance().error({
        ...this.loggerBaseData,
        ...input,
      } as ErrorInput);
    }
  }

  public warn(input: Partial<LogInput>) {
    if (this.level & LoggingLevel.WARN) {
      Logger.getInstance().warn({
        ...this.loggerBaseData,
        ...input,
      } as LogInput);
    }
  }
}
