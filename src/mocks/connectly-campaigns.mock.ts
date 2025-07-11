import { SERVICE_PROVIDER } from '../enums.ts';
import { ICampaignParameter } from "./interfaces.ts";
import * as UTILS from './utils.ts';

const versions: [number, string][] = [
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 1
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 2
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 3
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 4
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 5
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 6
   [5, "v1" ], [ 4, "v0" ], [ 3, "v1" ], [ 2, "v1" ], // 7
   [5, "v1" ], [ 4, "v0" ], [ 3, "v1" ], // 8
   [5, "v1" ], [ 4, "v0" ], [ 3, "v1" ], // 9
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], // 10
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], // 11
   [5, "v1" ], [ 4, "v1" ], // 12
   [5, "v1" ], [ 4, "v1" ], // 13
   [5, "v1" ], // 14
   [5, "v1" ], // 15
   [5, "v1" ], // 16
   [5, "v1" ], // 17
];

export const minMessagesPerCampaign = 2
export const maxMessagesPerCampaign = 3;

const getConnectlyCampaignKey = (num: number, lng = 'es') => (`${SERVICE_PROVIDER.Connectly}|${num}|${lng}`);

export const connectlyCampaignMap: Map<string, ICampaignParameter[]> = 
  versions.reduce((acc, [numCards, version, lng = 'es']) => { 
    const key = getConnectlyCampaignKey(numCards, lng);
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
    const name = `API_Carousel.${numCards}_${i}_${lng}_${version}`;
    campaings.push(
      { provider: SERVICE_PROVIDER.Connectly, name, variables, paths },
    )
    acc.set(key, campaings);
    return acc;
  }, new Map()
);
