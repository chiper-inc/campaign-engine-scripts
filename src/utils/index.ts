import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';

import { Config } from '../config.ts';
import { Logger } from 'logging-chiper';

export {
  daysFromBaseDate,
  formatMMMDD,
  formatDDMMYY,
  formatYYYYMMDD,
} from './date-utils.ts';

export {
  getCityId,
  getProvider,
  campaignToString,
  campaignFromString,
  putMessageToCampaignString,
} from './campign-name.ts';

export const replaceParams = (
  template: string,
  params: (string | number)[],
): string => {
  return params.reduce(
    (acc: string, param, i) => acc.replace(`{{${i}}}`, String(param)),
    template,
  );
};

export const getRandomNumber = (n: number): number =>
  Math.floor(Math.random() * n);

export const choose = <T>(arr: T[]): T => {
  const randomIndex = getRandomNumber(arr.length);
  return arr[randomIndex];
};

export const removeExtraSpaces = (val: string | number): string | number =>
  typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;

// Environment utilities

export const isProduction = (): boolean => {
  return Config.environment.toLowerCase() === 'production';
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// URL

export const addQueryParams = (url: string, query: string): string => {
  const [baseUrl, baseQuery] = (url ?? '').split('?');
  return baseUrl
    ? `${baseUrl}?${baseQuery ? `${baseQuery}&` : ''}${query}`
    : '';
};

// File Utilities

const filePath = (filename: string, dirname?: string): string => {
  dirname = dirname ?? os.tmpdir();
  return path.join(dirname, filename);
};

export const readFileToJson = (filename: string): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath(filename, process.cwd()), 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(parseErr as Error);
        }
      }
    });
  });
};

export const writeJsonToFile = (
  filename: string,
  data: unknown[],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.error('Writing to file:', filePath(filename));
    fs.writeFile(
      filePath(filename),
      JSON.stringify(data, null, 2),
      'utf-8',
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
};

export const uploadJsonToGoogleCloudStorage = (
  blobname: string,
  data: unknown[],
): Promise<void> => {
  const functionName = uploadJsonToGoogleCloudStorage.name;
  const stt = 'campaign-engine';
  const context = 'UTILS';
  return new Promise((resolve) => {
    const { bucketName, projectId } = Config.google.cloudStorage;

    const prefix = isProduction() ? '' : 'non-production/';
    const blobFile = new Storage({ projectId })
      .bucket(bucketName)
      .file(`${prefix}${blobname}`);

    resolve(
      blobFile
        .save(JSON.stringify(data, null, 2), {
          contentType: 'application/json',
        })
        .then((response: unknown) => {
          Logger.getInstance().warn({
            stt: 'campaign-engine',
            context: 'UTILS',
            functionName,
            message: `File uploaded to GCS gs://${bucketName}/${prefix}${blobname}`,
            data: { response },
          });
        })
        .catch((error: Error) => {
          Logger.getInstance().error({
            stt,
            context,
            functionName,
            error,
            message: `Error uploading file to GCS (gs://${bucketName}/${prefix}${blobname})`,
            data: { error },
          });
        }),
    );
  });
};
