import * as fs from 'fs';
import * as path from 'path';

import { BASE_DATE, CITY, CPG } from '../constants.ts';
import { LOCATION } from '../enums.ts';
import { Config } from '../config.ts';

export const daysFromBaseDate = (date: Date): number =>
  Math.trunc(((date as unknown as number) - BASE_DATE) / (1000 * 60 * 60 * 24));

export const formatMMMDD = (ddmmyy: string): string => {
  const mpnth = ddmmyy.slice(2, 4);
  const day = ddmmyy.slice(0, 2);
  const months = [
    '_',
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  return `${months[Number(mpnth)]}${day}`;
};

export const formatDDMMYY = (date: Date): string => {
  const isoString = date.toISOString();
  return isoString.slice(8, 10) + isoString.slice(5, 7) + isoString.slice(2, 4);
};

export const formatYYYYMMDD = (date: Date): string =>
  date.toISOString().slice(0, 10);

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

export const getCityId = (locationId: LOCATION) => CITY[locationId] || 0;

export const getCPG = (locationId: LOCATION) => CPG[locationId] || 0;

export const removeExtraSpaces = (val: string | number): string | number =>
  typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;

// Environment utilities

export const isProduction = (): boolean => {
  return Config.environment.toLowerCase() === 'production';
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// File Utilities

const filePath = (filename: string): string => {
  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = path.dirname(__filename);
  const __dirname = process.cwd();
  return path.join(__dirname, filename);
};

export const readFileToJson = (filename: string): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath(filename), 'utf8', (err, data) => {
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
