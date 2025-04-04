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

export enum LogLevel {
  LOG = 'log',
  ERROR = 'error',
  WARN = 'warn',
};

export class LoggingProvider {
  private readonly loggerBaseData: Partial<LogInput>;
  private readonly level: string[] = Config.logging.level;

  constructor(
    loggingOptions?: {context?: string, levels?: string[]},
  ) {
    const { context = LoggingProvider.name, levels = [] } = loggingOptions || {};
    this.level = levels.length > 0 ? levels : this.level;
    this.loggerBaseData = {
      stt: 'campaign-engine',
      context,
    };
  }

  public log(input: Partial<LogInput>) {
    if (this.level.includes(LogLevel.LOG)) { 
      Logger.getInstance().log({
        ...this.loggerBaseData,
        ...input,
      } as LogInput);
    }
  }

  public error(input: Partial<ErrorInput>) {
    if (this.level.includes(LogLevel.ERROR)) { 
        Logger.getInstance().error({
        ...this.loggerBaseData,
        ...input,
      } as ErrorInput);
    }
  }

  public warn(input: Partial<LogInput>) {
    if (this.level.includes(LogLevel.WARN)) { 
      Logger.getInstance().warn({
        ...this.loggerBaseData,
        ...input,
      } as LogInput);
    }
  }
}