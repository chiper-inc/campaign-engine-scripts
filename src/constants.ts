export const C2A_REFERENCE = 3;
export const C2A_MACRO = 4;
export const C2A_BRAND = 2;
export const C2A_OFFER_LIST = 17;

import { LOCATION } from './enums.ts';

export const CITY: { [ k in LOCATION]: number } = {
  [LOCATION._default]: 0,
  [LOCATION.BOG]: 1,
  [LOCATION.MDE]: 7,
  [LOCATION.CLO]: 2,
  [LOCATION.BAQ]: 3,
  [LOCATION.CMX]: 11,
  [LOCATION.SCL]: 21,
  [LOCATION.SAO]: 20,
  [LOCATION.VLN]: 24,
};

export const PROVIDER: { [ k in LOCATION]: number }= {
  [LOCATION._default]: 0,
  [LOCATION.BOG]: 1377,
  [LOCATION.MDE]: 1377,
  [LOCATION.CLO]: 1377,
  [LOCATION.BAQ]: 1377,
  [LOCATION.CMX]: 1381,
  [LOCATION.SCL]: 1379,
  [LOCATION.SAO]: 1378,
  [LOCATION.VLN]: 1380,
};

export const CITY_NAME: { [ k: number | string]: string } = {
  [CITY[LOCATION.BOG]]: 'Bogotá',
  [CITY[LOCATION.MDE]]: 'Medellín',
  [CITY[LOCATION.CLO]]: 'Cali',
  [CITY[LOCATION.BAQ]]: 'Barranquilla',
  [CITY[LOCATION.CMX]]: 'Ciudad de México',
  [CITY[LOCATION.SCL]]: 'Santiago de Chile',
  [CITY[LOCATION.SAO]]: 'Sao Paulo',
  [CITY[LOCATION.VLN]]: 'Valencia',
};
