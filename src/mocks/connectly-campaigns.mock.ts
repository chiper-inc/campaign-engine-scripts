import { PROVIDER } from '../enums.ts';
import { ICampaignParameter } from "./interfaces.ts";
import * as UTILS from './utils.ts';

const versions: [number, string][] = [
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 1
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 2
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 3
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 4
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 5
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 6
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], [ 2, "v1" ], // 7
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], // 8
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], // 9
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], // 10
   [5, "v1" ], [ 4, "v1" ], [ 3, "v1" ], // 11
   [5, "v1" ], [ 4, "v1" ], // 12
   [5, "v1" ], [ 4, "v1" ], // 13
   [5, "v1" ], // 14
   [5, "v1" ], // 15
   [5, "v1" ], // 16
   [5, "v1" ], // 17
];

const getConnectlyCampaignKey = (num: number, lng = 'es') => (`${PROVIDER.Connectly}|${num}|${lng}`);

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
      variables = UTILS.NAME.concat(UTILS.generateParams(UTILS.SKU_DSCT_IMG, numCards));
      paths = UTILS.generateParams(UTILS.PATH, numCards);
    }
    const i = campaings ? campaings.length + 1 : 1;
    const name = `API_Carousel.${numCards}_${i}_${lng}_${version}`;
    campaings.push(
      { provider: PROVIDER.Connectly, name, variables, paths },
    )
    acc.set(key, campaings);
    return acc;
  }, new Map()
);

// console.log('Campaings:', connectlyCampaignMap);

// for (let i = 0; i < 50; i++) {
//   const campaingsOfTheDay = [];
//   for (const messages of connectlyCampaignMap.values()) {
//     campaingsOfTheDay.push(messages[i % messages.length].name);
//   }
//   console.log(`Campaings of the day ${i + 1}:`, campaingsOfTheDay);
// }