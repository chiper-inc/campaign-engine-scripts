import { SERVICE_PROVIDER } from '../enums.ts';
import { ICampaignParameter } from "./interfaces.ts";
import * as UTILS from './utils.ts';

const versions: [number, string][] = [
   [5, "heuaho" ], [ 4, "bcrxxv" ], [ 3, "kynayr" ], [ 2, "ecugwo" ], // 1
   [5, "hmcmek" ], [ 4, "ieqcja" ], [ 3, "amuqos" ], [ 2, "lictit" ], // 2
   [5, "kgkvyj" ], [ 4, "dalkrn" ], [ 3, "kwfszr" ], [ 2, "smzljn" ], // 3
   [5, "zaosoj" ], [ 4, "gribcf" ], [ 3, "ugcjir" ], [ 2, "kkszae" ], // 4
   [5, "ezcadf" ], [ 4, "vrrqst" ], [ 3, "xglxmr" ], [ 2, "frsxpl" ], // 5
   [5, "cjyuyj" ], [ 4, "rrvdtx" ], [ 3, "falejb" ], [ 2, "arwkqp" ], // 6
   [5, "fqxjxu" ], [ 4, "gwgqry" ], [ 3, "vsdwfw" ], [ 2, "foqnbh" ], // 7
   [5, "thpwae" ], [ 4, "mmzlcs" ], [ 3, "ftnnyu" ], // 8
   [5, "cogiri" ], [ 4, "cjyird" ], [ 3, "bvfxoc" ], // 9
   [5, "tqflwn" ], [ 4, "yowudn" ], [ 3, "dmxkez" ], // 10
   [5, "ylxzjt" ], [ 4, "vxknbc" ], [ 3, "kkyzkk" ], // 11
   [5, "bfznsv" ], [ 4, "fgzawf" ], // 12
   [5, "zhyzfs" ], [ 4, "otoxmx" ], // 13
   [5, "banwwd" ], // 14
   [5, "jevuhn" ], // 15
   [5, "jvjrib" ], // 16
   [5, "rdrvfy" ], // 17
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

