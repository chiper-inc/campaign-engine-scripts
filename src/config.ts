import dotenv from 'dotenv';
import * as CONST from './constants.ts';

dotenv.config();

export const Config = {
  connectly: {
    apiKey: process.env.CONNECTLY_API_KEY || '',
    apiUrl: process.env.CONNECTLY_API_URL || '',
    businessId: process.env.CONNECTLY_BUSINESS_ID || '',
    batchSize: 50,
  },
  lbApiOperaciones: {
    callToAction: {
      reference: CONST.C2A_REFERENCE,
      macro: CONST.C2A_MACRO,
      brand: CONST.C2A_BRAND,
      offerList: CONST.C2A_OFFER_LIST,
    },
    apiUrl: process.env.LB_API_OPERACIONES_URL || '',
    apiKey: process.env.LB_API_OPERACIONES_KEY || null,
    apiToken: process.env.LB_API_OPERACIONES_TOKEN || '',
  },
  slack: {
    url: process.env.SLACK_URL || '',
  }
}
