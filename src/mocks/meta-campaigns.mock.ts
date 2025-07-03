import { SERVICE_PROVIDER } from '../enums.ts';
import { ICampaignParameter } from "./interfaces.ts";
import * as UTILS from './utils.ts';

const versions: [number, string][] = [
   [5, "jfjbib" ], [ 4, "dduucu" ], [ 3, "dnrvnc" ], [ 2, "sgknqs" ], // 1
   [5, "jqzeia" ], [ 4, "bhoeha" ], [ 3, "cawlii" ], [ 2, "codqly" ], // 2
   [5, "hxuyog" ], [ 4, "fjuuqa" ], [ 3, "lldeje" ], [ 2, "wsgruv" ], // 3
   [5, "puxvhd" ], [ 4, "fzirrn" ], [ 3, "livfmg" ], [ 2, "oqzalu" ], // 4
   [5, "uuczhl" ], [ 4, "rkrdqv" ], [ 3, "kmxtkt" ], [ 2, "npbcgu" ], // 5
   [5, "wbtprj" ], [ 4, "fxghdj" ], [ 3, "uwogio" ], [ 2, "gvmytd" ], // 6
   [5, "qwtxbi" ], [ 4, "hgzyld" ], [ 3, "blovno" ], [ 2, "vmjqqj" ], // 7
   [5, "udjviv" ], [ 4, "qsgmoh" ], [ 3, "gqwilv" ], // 8
   [5, "wwwabd" ], [ 4, "hxojoo" ], [ 3, "imywmk" ], // 9
   [5, "fykauu" ], [ 4, "fztptg" ], [ 3, "biwxix" ], // 10
   [5, "axnwtp" ], [ 4, "dzfgil" ], [ 3, "hlqsly" ], // 11
   [5, "rrypil" ], [ 4, "cniech" ], // 12
   [5, "sknmzx" ], [ 4, "ptnils" ], // 13
   [5, "qzrvdk" ], // 14
   [5, "snmmxe" ], // 15
   [5, "yrigrp" ], // 16
   [5, "tlkcja" ], // 17
];

export const minMessagesPerCampaign = 2
export const maxMessagesPerCampaign = 5;

const getMetaCampaignKey = (num: number, lng = 'es') => (`${SERVICE_PROVIDER.Meta}|${num}|${lng}`);

export const metaCampaignMap: Map<string, ICampaignParameter[]> = 
  versions.reduce((acc, [numCards, version, lng = 'es']) => { 
    const key = getMetaCampaignKey(numCards, lng);
    const campaings = acc.get(key) || [];
    let variables: string[] = [];
    let paths: string[] = [];
    if (campaings.length > 0) {
      variables = campaings[0].variables;
      paths = campaings[0].paths;
    } else {
      variables =
        UTILS.NAME_SGMT
          .concat(UTILS.generateParams(UTILS.SKU_DSCT_IMG, numCards))
          .sort((a, b) => a.localeCompare(b));
      paths = 
        UTILS.generateParams(UTILS.PATH, numCards)
          .sort((a, b) => a.localeCompare(b));
    }
    const i = campaings ? campaings.length + 1 : 1;
    const name = `API_Carousel.${numCards}_${i}_${version}`;
    campaings.push(
      { provider: SERVICE_PROVIDER.Meta, name, variables, paths },
    )
    acc.set(key, campaings);
    return acc;
  }, new Map()
);

