import dotenv from 'dotenv';
import * as CONST from './constants.ts';
import { env } from 'process';

dotenv.config();

export const Config = {
  environment: env.ENVIRONMENT ?? 'development',
  logging: {
    level: ['error'],
  },
  connectly: {
    apiKey: process.env.CONNECTLY_API_KEY ?? '',
    apiUrl: process.env.CONNECTLY_API_URL ?? '',
    businessId: process.env.CONNECTLY_BUSINESS_ID ?? '',
    batchSize: 32,
  },
  lbApiOperaciones: {
    callToAction: {
      reference: CONST.C2A_REFERENCE,
      referencePromotion: CONST.C2A_REFERENCE_PROMOTION,
      offerList: CONST.C2A_OFFER_LIST,
      macro: CONST.C2A_MACRO,
      brand: CONST.C2A_BRAND,
      discountList: CONST.C2A_DISCOUNT_LIST,
      customOffer: {
        titles: ['custom.Offer.0', 'custom.Offer.1', 'custom.Offer.2'],
        imageUrls: [
          // 'https://chiper-old-imgs.imgix.net/app/7707244560255-manzana-1000ml-sellos-photoroom-ByAdwH6c0-R.png',
          'https://chiper-old-imgs.imgix.net/app/no-image-ryahXCwGV-R.jpg',
        ],
      },
    },
    apiUrl: process.env.LB_API_OPERACIONES_URL ?? '',
    apiKey: process.env.LB_API_OPERACIONES_KEY ?? null,
    apiToken: process.env.LB_API_OPERACIONES_TOKEN ?? '',
    batchSize: 16,
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
    vertexAI: {
      model: 'gemini-2.0-flash-001',
      bacthSize: 64,
    },
    cloudStorage: {
      projectId: 'dataflow-chiper',
      bucketName: 'campaign-engine',
    },
  },
  clevertap: {
    apiUrl: process.env.CLEVERTAP_API_URL ?? '',
    accountId: process.env.CLEVERTAP_API_ACCOUNT_ID ?? '',
    passcode: process.env.CLEVERTAP_API_PASSCODE ?? '',
    batchSize: 16,
  },
};
