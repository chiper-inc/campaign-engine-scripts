import { BASE_DATE, CITY, CPG } from '../constants.ts';
import { LOCATION } from '../enums.ts';

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

export const formatDDMMYY = (date: Date): string =>
  date
    .toLocaleDateString('es-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .replace(/\//g, '');

export const getCityId = (locationId: LOCATION) => CITY[locationId] || 0;

export const getCPG = (locationId: LOCATION) => CPG[locationId] || 0;

export const removeExtraSpaces = (val: string | number): string | number =>
  typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;
