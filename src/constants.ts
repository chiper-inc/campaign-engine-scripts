export const BASE_DATE = new Date('2025/03/05').setHours(
  0,
  0,
  0,
  0,
) as unknown as number;

import { CHANNEL, LOCATION, PROVIDER } from './enums.ts';

export const CITY: { [k in LOCATION]: number } = {
  [LOCATION._default]: 0,
  [LOCATION.BOG]: 1,
  [LOCATION.MDE]: 7,
  [LOCATION.CLO]: 2,
  [LOCATION.BAQ]: 3,
  [LOCATION.BGA]: 5,
  [LOCATION.CMX]: 11,
  [LOCATION.SCL]: 21,
  [LOCATION.SAO]: 20,
  [LOCATION.VLN]: 24,
};

export const CPG: { [k in LOCATION]: number } = {
  [LOCATION._default]: 0,
  [LOCATION.BOG]: 1377,
  [LOCATION.MDE]: 1377,
  [LOCATION.CLO]: 1377,
  [LOCATION.BAQ]: 1377,
  [LOCATION.BGA]: 1377,
  [LOCATION.CMX]: 1381,
  [LOCATION.SCL]: 1379,
  [LOCATION.SAO]: 1378,
  [LOCATION.VLN]: 1380,
};

export const CITY_NAME: { [k: number | string]: string } = {
  [CITY[LOCATION.BOG]]: 'Bogotá',
  [CITY[LOCATION.MDE]]: 'Medellín',
  [CITY[LOCATION.CLO]]: 'Cali',
  [CITY[LOCATION.BAQ]]: 'Barranquilla',
  [CITY[LOCATION.BGA]]: 'Bucaramanga',
  [CITY[LOCATION.CMX]]: 'Ciudad de México',
  [CITY[LOCATION.SCL]]: 'Santiago de Chile',
  [CITY[LOCATION.SAO]]: 'Sao Paulo',
  [CITY[LOCATION.VLN]]: 'Valencia',
};

export const CITY_LOCATION: { [k: number]: LOCATION } = {
  [CITY[LOCATION.BOG]]: LOCATION.BOG,
  [CITY[LOCATION.MDE]]: LOCATION.MDE,
  [CITY[LOCATION.CLO]]: LOCATION.CLO,
  [CITY[LOCATION.BAQ]]: LOCATION.BAQ,
  [CITY[LOCATION.BGA]]: LOCATION.BGA,
  [CITY[LOCATION.CMX]]: LOCATION.CMX,
  [CITY[LOCATION.SCL]]: LOCATION.SCL,
  [CITY[LOCATION.SAO]]: LOCATION.SAO,
  [CITY[LOCATION.VLN]]: LOCATION.VLN,
};

const moneyFormatter = {
  CO: new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
  MX: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  BR: new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  CL: new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
  VE: new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD', // La moneda primaria para VE es USD, por ello no se usa VES
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'narrowSymbol',
  }),
};

export const MONEY_FORMATTER = {
  [LOCATION._default]: moneyFormatter.MX,
  [LOCATION.BOG]: moneyFormatter.CO,
  [LOCATION.CLO]: moneyFormatter.CO,
  [LOCATION.MDE]: moneyFormatter.CO,
  [LOCATION.BAQ]: moneyFormatter.CO,
  [LOCATION.BGA]: moneyFormatter.CO,
  [LOCATION.CMX]: moneyFormatter.MX,
  [LOCATION.SCL]: moneyFormatter.CL,
  [LOCATION.SAO]: moneyFormatter.BR,
  [LOCATION.VLN]: moneyFormatter.VE,
};

export const PROVIDER_CHANNEL: { [k in PROVIDER]: CHANNEL } = {
  [PROVIDER.Connectly]: CHANNEL.WhatsApp,
  [PROVIDER.Clevertap]: CHANNEL.PushNotification,
};

export const CHANNEL_PROVIDER: { [k in CHANNEL]: PROVIDER } = {
  [CHANNEL.WhatsApp]: PROVIDER.Connectly,
  [CHANNEL.PushNotification]: PROVIDER.Clevertap,
};
