// import { CampaignProvider } from '../services/campaign.service.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';
import { Config } from '../config.ts';
// import { StoreReferenceMap } from '../mocks/store-reference.mock.ts';
import {
  IShortLinkRequest,
  IShortLinkResponse,
  IShortLinkResponseAndKey,
} from './interfaces.ts';
import * as UTILS from '../utils/index.ts';

export class LbApiOperacionesIntegration {
  private readonly url;
  private readonly apiKey; // Replace with a real token if needed
  private readonly batchSize;
  private readonly headers;
  private readonly WAITING_TIME = 750;
  private readonly maxRetries = 3;
  private readonly logger: LoggingProvider;

  constructor() {
    this.batchSize = Config.lbApiOperaciones.batchSize;

    this.url = `${Config.lbApiOperaciones.apiUrl}`;
    this.apiKey = Config.lbApiOperaciones.apiKey; // Replace with a real token if needed
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: Config.lbApiOperaciones.apiKey
        ? Config.lbApiOperaciones.apiKey
        : `Bearer ${Config.lbApiOperaciones.apiToken}`, // Replace with a real token if needed
    };
    this.logger = new LoggingProvider({
      context: LbApiOperacionesIntegration.name,
      levels: LoggingProvider.WARN | LoggingProvider.ERROR,
    });
    this.logger.log({
      message: 'LbApiOperacionesIntegration initialized',
      data: { url: this.url, batchSize: this.batchSize },
    });
  }

  public async createOneShortLink(
    payload: IShortLinkRequest,
    retry: number = 0,
  ): Promise<{ data?: IShortLinkResponse } | null> {
    const functionName = this.createOneShortLink.name;

    if (retry >= this.maxRetries) {
      this.logger.error({
        message: `Max retries (${this.maxRetries}), reached for creating short link`,
        functionName,
        error: new Error('Max retries reached'),
        data: { payload },
      });
      return null;
    }
    if (retry > 0) await this.sleep();

    const url = `${Config.lbApiOperaciones.apiUrl}/operational/create-external-action`;

    // const url = `${Config.lbApiOperaciones.apiUrl}/operational/create-external-action${
    //   (payload?.callToAction?.storeReferenceId || 1) % 101 === 0 ? '/sss' : ''
    // }`;

    // if (payload?.callToAction?.storeReferenceId) {
    //   payload.callToAction.referenceId = StoreReferenceMap.get(
    //     payload.callToAction.storeReferenceId,
    //   )?.referenceId as number;
    // }

    const request = {
      url,
      method: 'POST',
      body: payload,
      headers: this.headers,
    };
    return fetch(request.url, {
      method: request.method,
      headers: this.headers,
      body: JSON.stringify(request.body),
    })
      .then(async (response): Promise<{ data?: IShortLinkResponse } | null> => {
        if (response.status !== 200) {
          this.logger.error({
            message: `Error creating short link - Retry ${retry}`,
            functionName,
            error: new Error(
              `Status: ${response.status} - ${response.statusText}`,
            ),
            data: { request, response },
          });
          return this.createOneShortLink(payload, retry + 1);
        }
        return Promise.resolve(
          response.json() as unknown as { data?: IShortLinkResponse },
        );
      })
      .catch(async (error): Promise<{ data?: IShortLinkResponse } | null> => {
        this.logger.error({
          message: `Error creating short link - Retry ${retry}`,
          functionName,
          error: new Error(error as string),
          data: { request },
        });
        return this.createOneShortLink(payload, retry + 1);
      });
  }

  private splitIntoBatches(
    arr: IShortLinkResponseAndKey[],
    batchSize: number,
  ): IShortLinkResponseAndKey[][] {
    return arr.reduce((acc, _, i) => {
      if (i % batchSize === 0) {
        acc.push(arr.slice(i, i + batchSize));
      }
      return acc;
    }, [] as IShortLinkResponseAndKey[][]);
  }

  public async createAllShortLink(
    payloadsAndKeys: IShortLinkResponseAndKey[],
  ): Promise<
    { key: string; response: { data?: IShortLinkResponse } | null }[]
  > {
    const functionName = this.createAllShortLink.name;

    let responses: {
      key: string;
      response: { data?: IShortLinkResponse } | null;
    }[] = [];
    const batches = this.splitIntoBatches(payloadsAndKeys, this.batchSize);
    const batchCount = batches.length;
    let batchIdx = 0;
    this.logger.warn({
      message: 'Start Creating shortLinks',
      data: { batchCount, batchSize: this.batchSize },
    });
    for (const batch of batches) {
      const batchResponse: {
        key: string;
        response: { data?: IShortLinkResponse } | null;
      }[] = await Promise.all(
        batch.map(async ({ key, value }) => {
          return new Promise((resolve, reject) => {
            this.createOneShortLink(value)
              .then((result) => {
                resolve({ key, response: result });
              })
              .catch((error) => {
                this.logger.error({
                  message: 'Error creating short link',
                  functionName,
                  error: new Error(error as string),
                  data: { key, value },
                });
                reject(error);
              });
          });
        }),
      );
      responses = responses.concat(batchResponse);
      this.logger.warn({
        message: `batch ${++batchIdx} of ${batchCount} for ShorLinks done. ${responses.length} responses.`,
        functionName,
        data: { batchIdx, batchCount, responses: responses.length },
      });
      // Wait for a random time between 0 and WAITING_TIME/2
      await this.sleep();
    }
    this.logger.warn({
      message: `End Creating ShortLinks`,
      functionName,
      data: { batchIdx, batchCount, responses: responses.length },
    });
    return responses;
  }

  private sleep(): Promise<void> {
    return UTILS.sleep(
      this.WAITING_TIME + Math.floor((Math.random() * this.WAITING_TIME) / 2),
    );
  }
}
