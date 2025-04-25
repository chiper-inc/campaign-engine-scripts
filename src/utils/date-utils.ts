import { BASE_DATE } from '../constants.ts';

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
