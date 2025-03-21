import dotenv from 'dotenv';
import * as CONST from './constants.ts';
import { env } from 'process';

dotenv.config();

export const Config = {
  environment: env.ENVIRONMENT ?? 'development',
  connectly: {
    apiKey: process.env.CONNECTLY_API_KEY ?? '',
    apiUrl: process.env.CONNECTLY_API_URL ?? '',
    businessId: process.env.CONNECTLY_BUSINESS_ID ?? '',
    batchSize: 50,
  },
  lbApiOperaciones: {
    callToAction: {
      reference: CONST.C2A_REFERENCE,
      macro: CONST.C2A_MACRO,
      brand: CONST.C2A_BRAND,
      offerList: CONST.C2A_OFFER_LIST,
    },
    apiUrl: process.env.LB_API_OPERACIONES_URL ?? '',
    apiKey: process.env.LB_API_OPERACIONES_KEY ?? null,
    apiToken: process.env.LB_API_OPERACIONES_TOKEN ?? '',
  },
  slack: {
    reportUrl: process.env.SLACK_API_REPORT_URL ?? '',
  },
  catalogue: {
    apiUrl: process.env.CATALOGUE_API_URL ?? '',
    oldImageUrl: process.env.CATALOGUE_OLD_IMAGE_URL ?? '',
    newImageUrl: process.env.CATALOGUE_NEW_IMAGE_URL ?? '',
  },
  google: {
    project: process.env.GOOGLE_PROJECT ?? '',
    location: process.env.GOOGLE_LOCATION ?? '',
    cloudTask: {
      queue: process.env.GOOGLE_CLOUD_TASK_QUEUE ?? '',
    },
  },
  clevertap: {
    accountId: process.env.CLEVERTAP_API_ACCOUNT_ID ?? '',
    passcode: process.env.CLEVERTAP_API_PASSCODE ?? '',
  },
};
