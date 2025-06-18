import Joi from 'joi';
import dotenv from 'dotenv';
import * as CUSTOM_OFFER from './mocks/custom-offer.mock.ts';

dotenv.config();

// Define the Joi schema for validation
const configSchema = Joi.object({
  environment: Joi.string()
    .valid('develop', 'production', 'staging')
    .required(),
  parameter: {
    frequencies: Joi.array()
      .items(
        Joi.object({
          communicationChannel: Joi.string().required(),
          storeStatus: Joi.string().required(),
          locationId: Joi.string().required(),
          to: Joi.number().integer().min(1).allow(null),
          from: Joi.number().integer().min(1).allow(null),
          storeValue: Joi.string().allow(null),
          frequency: Joi.number().integer().min(1).max(255).required(),
        }),
      )
      .required(),
  },
  logging: Joi.object({
    levels: Joi.array()
      .items(Joi.string().valid('error', 'warn', 'log'))
      .required(),
  }).required(),
  connectly: Joi.object({
    apiKey: Joi.string().required(),
    apiUrl: Joi.string().uri().required(),
    businessId: Joi.string().uuid().required(),
    batchSize: Joi.number().integer().min(1).max(128).required(),
  }).required(),
  metaGateway: Joi.object({
    apiUrl: Joi.string().uri().required(),
    apiKey: Joi.string().required(),
    appId: Joi.string().required(),
    sourcePhoneId: Joi.string().required(),
    batchSize: Joi.number().integer().min(1).max(128).required(),
  }).required(),
  lbApiOperaciones: Joi.object({
    callToAction: Joi.object({
      reference: Joi.number().integer().required(),
      referencePromotion: Joi.number().integer().required(),
      offerList: Joi.number().integer().required(),
      macro: Joi.number().integer().required(),
      brand: Joi.number().integer().required(),
      discountList: Joi.number().integer().required(),
      customOffer: Joi.object({
        titles: Joi.array().items(Joi.string()).required(),
        imageUrls: Joi.array().items(Joi.string().uri()).required(),
      }).required(),
    }).required(),
    apiUrl: Joi.string().uri().required(),
    apiKey: Joi.string().allow(null),
    apiToken: Joi.string().allow(null),
    token: Joi.string().allow(null),
    batchSize: Joi.number().integer().min(1).max(32).required(),
  }).required(),
  slack: Joi.object({
    reportUrl: Joi.string().uri().required(),
  }).required(),
  catalogue: Joi.object({
    apiUrl: Joi.string().uri().required(),
    oldImageUrl: Joi.string().uri().required(),
    newImageUrl: Joi.string().uri().required(),
  }).required(),
  google: Joi.object({
    project: Joi.string().required(),
    location: Joi.string().required(),
    cloudTask: Joi.object({
      queue: Joi.string().required(),
    }).required(),
    cloudInjector: Joi.object({
      url: Joi.string().uri().required(),
      queue: Joi.string().required(),
      key: Joi.string().required(),
    }).required(),
    vertexAI: Joi.object({
      model: Joi.string().required(),
      bacthSize: Joi.number().integer().min(1).max(64).required(),
    }).required(),
    cloudStorage: Joi.object({
      projectId: Joi.string().required(),
      bucketName: Joi.string().required(),
    }).required(),
  }).required(),
  clevertap: Joi.object({
    apiUrl: Joi.string().uri().required(),
    accountId: Joi.string().required(),
    passcode: Joi.string().required(),
    batchSize: Joi.number().integer().min(1).max(64).required(),
  }).required(),
});

// Define the configuration object

export const Config = {
  environment: process.env.ENVIRONMENT ?? 'develop',
  logging: {
    levels: process.env.LOGGING_LEVELS
      ? process.env.LOGGING_LEVELS.split(',').map((level) =>
          level.trim().toLowerCase(),
        )
      : [],
  },
  parameter: {
    frequencies: JSON.parse(process.env.ENGINE_PARAMETER_FREQUENCIES ?? '[]'),
  },
  connectly: {
    apiKey: process.env.CONNECTLY_API_KEY ?? '',
    apiUrl: process.env.CONNECTLY_API_URL ?? '',
    businessId: process.env.CONNECTLY_BUSINESS_ID ?? '',
    batchSize: 32,
  },
  metaGateway: {
    apiUrl: process.env.META_GATEWAY_API_URL ?? '',
    apiKey: process.env.META_GATEWAY_API_KEY ?? '',
    appId: process.env.META_GATEWAY_APP_ID ?? '',
    sourcePhoneId: process.env.META_GATEWAY_SOURCE_PHONE ?? '',
    batchSize: 32,
  },
  lbApiOperaciones: {
    callToAction: {
      reference: 3, // CONST.C2A_REFERENCE,
      referencePromotion: 6, // CONST.C2A_REFERENCE_PROMOTION,
      offerList: 30, // CONST.C2A_OFFER_LIST,
      macro: 4, // CONST.C2A_MACRO,
      brand: 2, // CONST.C2A_BRAND,
      discountList: 17, // CONST.C2A_DISCOUNT_LIST,
      customOffer: {
        titles: CUSTOM_OFFER.titles, // ['Title.1', 'Title.2', 'Title.3'],
        imageUrls: CUSTOM_OFFER.imageUrls, // ['https://example.com/image1.jpg', 'https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
      },
    },
    apiUrl: process.env.LB_API_OPERACIONES_URL ?? '',
    apiKey: process.env.LB_API_OPERACIONES_KEY || null,
    apiToken: process.env.LB_API_OPERACIONES_TOKEN || null,
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
    cloudInjector: {
      url: process.env.GOOGLE_CLOUD_TASK_INJECTOR_URL ?? '',
      queue: process.env.GOOGLE_CLOUD_TASK_INJECTOR_QUEUE ?? '',
      key: process.env.GOOGLE_CLOUD_TASK_INJECTOR_KEY ?? '',
    },
    vertexAI: {
      model: 'gemini-2.0-flash-001',
      bacthSize: 32,
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
    batchSize: 16 * 4, // 512,
  },
};

// Validate the configuration object against the schema

const { error } = configSchema.validate(Config, { abortEarly: false });
if (error) {
  console.error('Configuration validation error:', error.message);
  process.exit(1);
}
