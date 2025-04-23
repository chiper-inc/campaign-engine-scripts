import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';

// import { BASE_DATE, CITY, CPG } from '../constants.ts';
// import { LOCATION } from '../enums.ts';
import { Config } from '../config.ts';
import { Logger } from 'logging-chiper';
import { util } from 'node_modules/@google-cloud/storage/build/esm/src/nodejs-common/util.js';

export {
  daysFromBaseDate,
  formatMMMDD,
  formatDDMMYY,
  formatYYYYMMDD,
} from './date-utils.ts';

export {
  getCityId,
  getCPG,
  campaignToString,
  campaignFromString,
  putMessageToCampaignString,
} from './campign-name.ts';

// export const daysFromBaseDate = (date: Date): number =>
//   Math.trunc(((date as unknown as number) - BASE_DATE) / (1000 * 60 * 60 * 24));

// export const formatMMMDD = (ddmmyy: string): string => {
//   const mpnth = ddmmyy.slice(2, 4);
//   const day = ddmmyy.slice(0, 2);
//   const months = [
//     '_',
//     'Ene',
//     'Feb',
//     'Mar',
//     'Abr',
//     'May',
//     'Jun',
//     'Jul',
//     'Ago',
//     'Sep',
//     'Oct',
//     'Nov',
//     'Dic',
//   ];
//   return `${months[Number(mpnth)]}${day}`;
// };

// export const formatDDMMYY = (date: Date): string => {
//   const isoString = date.toISOString();
//   return isoString.slice(8, 10) + isoString.slice(5, 7) + isoString.slice(2, 4);
// };

// export const formatYYYYMMDD = (date: Date): string =>
//   date.toISOString().slice(0, 10);

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
  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = path.dirname(__filename);
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
