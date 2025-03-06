import dotenv from 'dotenv';

dotenv.config();

export const CONNECTLY_API_KEY = process.env.CONNECTLY_API_KEY || '';
export const CONNECTLY_API_URL = process.env.CONNECTLY_API_URL || '';
export const CONNECTLY_BUSINESS_ID = process.env.CONNECTLY_BUSINESS_ID || '';
export const BATCH_SIZE = 50;