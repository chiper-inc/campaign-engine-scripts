import { CHANNEL } from '../enums.ts';
import { IStoreSuggestion, OFFER_TYPE } from '../repositories/interfaces.ts';
import { IStoreRecommendation } from './interfaces.ts';
import {
  TypeCampaignEntry,
  TypeSku,
  TypeStore,
  TypeStoreParams,
} from '../types.ts';
import { IUtm } from '../integrations/interfaces.ts';
import * as UTILS from '../utils/index.ts';
import { CHANNEL_PROVIDER } from '../constants.ts';
import { campaignMap, getCampaignKey } from '../parameters.ts';
import { StoreReferenceMap } from '../mocks/store-reference.mock.ts';
import { getCampaignSegmentName } from '../parameters/campaigns.ts';
import * as CLEVERATAP from '../mocks/clevertap-campaigns.mock.ts';
import { v4 as uuid } from 'uuid';

export class StoreRecommendationProvider {
  private readonly baseDate: number;
  private readonly uuid: string;

  constructor(baseDate: number, UUID: string) {
    this.baseDate = baseDate as number;
    this.uuid = UUID;
  }

  public generateMap(
    filteredData: IStoreSuggestion[],
  ): Map<number, IStoreRecommendation> {
    return filteredData.reduce((acc, row) => {
      const params: TypeStoreParams = {
        locationId: row.locationId,
        communicationChannel: row.communicationChannel,
        storeStatus: row.storeStatus,
        storeValue: row.storeValue,
        city: row.city,
        from: row.from ?? null,
        to: row.to ?? null,
      };
      const a = acc.get(row.storeId) || {
        params,
        store: this.getStore(row),
        skus: [],
      };
      a.skus.push(this.getSku(row));
      acc.set(row.storeId, a);
      return acc;
    }, new Map());
  }

  public assignCampaignAndUtm(
    storeMap: Map<number, IStoreRecommendation>,
    day: number,
  ): Map<number, IStoreRecommendation> {
    const newStoreMap = new Map();
    for (const [storeId, storeRecommendation] of storeMap.entries()) {
      const { params, skus } = storeRecommendation;
      const campaign = this.getCampaignRange(params, day, skus.length);

      if (!campaign) continue;

      const utm = this.getUtm(params, day);
      newStoreMap.set(storeId, {
        ...storeRecommendation,
        campaign,
        utm,
      });
    }
    return newStoreMap;
  }

  private getStore = (row: IStoreSuggestion): TypeStore => ({
    storeId: row.storeId,
    name: row.name,
    phone: row.phone,
    storeStatus: row.storeStatus,
  });

  private getSku = (row: IStoreSuggestion): TypeSku => {
    const storeReferenceId =
      row.recommendationType === OFFER_TYPE.storeReference
        ? row.recommendationId
        : null;
    const referencePromotionId =
      row.recommendationType === OFFER_TYPE.referencePromotion
        ? row.recommendationId
        : null;
    const image = StoreReferenceMap.get(storeReferenceId)?.regular ?? '';
    return {
      skuType: row.recommendationType,
      storeReferenceId,
      referencePromotionId,
      reference: row.reference,
      discountFormatted: row.discountFormatted,
      image,
    };
  };

  private getCampaignRange = (
    { communicationChannel /* , locationId */ }: TypeStoreParams,
    day: number,
    numberOfAvailableSkus: number,
  ): TypeCampaignEntry | null => {
    const generateArray = (n: number): number[] => {
      const arr = [];
      for (let i = 1; i <= n; i++) {
        arr.push(i);
      }
      return arr;
    };

    const adjustToMessageConstraint = (channel: CHANNEL, n: number): number => {
      const MESSAGE_CONSTRAINT = {
        [CHANNEL.WhatsApp]: [2, 3, 4],
        [CHANNEL.PushNotification]: generateArray(
          CLEVERATAP.maxMessagesPerCampaign,
        ),
      };
      const options = MESSAGE_CONSTRAINT[channel] ?? [];
      if (!options.length) return 0;

      const min = Math.min(...options);
      const max = Math.max(...options);

      if (n < min) return 0; // No hay productos suficientes
      if (n > max) return max; // Se toma la cantidad maxima de productos

      let resp = min;
      for (const option of options) {
        if (resp < option && option <= n) {
          resp = option;
        }
      }
      return resp;
    };

    const numberOfSkus = adjustToMessageConstraint(
      communicationChannel,
      numberOfAvailableSkus,
    );
    if (!numberOfSkus) return null;

    const campaigns = campaignMap.get(
      getCampaignKey({
        communicationChannel,
        numberOfSkus,
      }),
    );
    if (campaigns) {
      const campaign = campaigns[day % campaigns.length];

      if (!campaign) return null;
      if (
        campaign.variables.filter((v) => v.startsWith('sku')).length >
        numberOfSkus
      ) {
        return null;
      }
      return {
        name: campaign.name,
        variables: campaign.variables,
        paths: campaign.paths,
      };
    }
    return null;
  };

  private getUtm = (params: TypeStoreParams, day: number): IUtm => {
    const channelMap: { [k in CHANNEL]: string } = {
      [CHANNEL.WhatsApp]: 'WA',
      [CHANNEL.PushNotification]: 'PN',
    };

    const segment = getCampaignSegmentName(params);
    const { communicationChannel, locationId } = params;
    const asset = channelMap[communicationChannel] ?? 'XX';
    const payer = '1'; // Fix value
    const type = 'ot';

    const date = new Date(this.baseDate + day * 24 * 60 * 60 * 1000);
    const term = UTILS.formatDDMMYY(date); // DDMMYY
    const campaign = `${UTILS.getCityId(locationId)}_${UTILS.getCPG(locationId)}_${
      asset
    }_${payer}_${UTILS.formatMMMDD(term)}_${type}_${segment}`;
    const source =
      `${CHANNEL_PROVIDER[communicationChannel]}-campaign`.toLowerCase();
    const content = uuid();
    const medium = '164';
    return {
      campaignName: campaign,
      campaignContent: content,
      campaignTerm: term,
      campaignSource: source,
      campaignMedium: medium,
    };
  };
}
