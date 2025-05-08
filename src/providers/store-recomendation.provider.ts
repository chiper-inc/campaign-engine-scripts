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
import { campaignMap, frequencyMap, getCampaignKey } from '../parameters.ts';
import { StoreReferenceMap } from '../mocks/store-reference.mock.ts';
import { getCampaignSegmentName } from '../parameters/campaigns.ts';
import * as CAMPAING from '../parameters/campaigns.ts';
import { v4 as uuid } from 'uuid';
import { Config } from '../config.ts';
import { BigQueryRepository } from '../repositories/big-query.ts';
import { frequencyByLocationAndStatusAndRange } from '../parameters.ts';

export class StoreRecommendationProvider {
  private static oldHostName = Config.catalogue.oldImageUrl;
  private static newHostName = Config.catalogue.newImageUrl;
  private static storeReferenceMap = StoreReferenceMap;

  private readonly baseDate: Date;
  private readonly skuMapValue: Map<string, TypeSku>;
  private storeMapValue: Map<string, IStoreRecommendation>;

  constructor({ baseDate }: { baseDate: Date }) {
    this.baseDate = baseDate;
    this.skuMapValue = new Map();
    this.storeMapValue = new Map();
  }

  public async load({
    limit,
    offset,
    day,
    filter,
  }: {
    limit?: number;
    offset?: number;
    day: number;
    filter: (
      row: IStoreSuggestion,
      frequencyMap: Map<string, number>,
      day: number,
    ) => boolean;
  }): Promise<void> {
    const bigQueryRepository = new BigQueryRepository({ offset, limit });
    const data = await bigQueryRepository.selectStoreSuggestions(
      frequencyByLocationAndStatusAndRange,
      [CHANNEL.WhatsApp, CHANNEL.PushNotification],
    );
    this.storeMapValue = this.assignCampaignAndUtm(
      this.generateMap(
        data.filter((row) => filter(row, frequencyMap, day)),
        day,
      ),
      day,
    );
  }

  private generateMap(
    filteredData: IStoreSuggestion[],
    day: number,
  ): Map<string, Partial<IStoreRecommendation>> {
    const getStoreKey = (id: number, channel: CHANNEL): string =>
      `${id}-${channel}`;
    const mapLookup = ({
      acc,
      row,
      channel,
      params,
    }: {
      acc: Map<string, IStoreRecommendation>;
      row: IStoreSuggestion;
      channel: CHANNEL;
      params: TypeStoreParams;
    }): Partial<IStoreRecommendation> =>
      acc.get(getStoreKey(row.storeId, channel)) || {
        params: { ...params, communicationChannel: channel },
        store: this.getStore(row),
        skus: [] as TypeSku[],
      };

    const getRecomendationPerChannel = ({
      channels,
      row,
      isTurn,
      recommendation,
    }: {
      channels: CHANNEL[];
      row: IStoreSuggestion;
      isTurn: boolean;
      recommendation: Partial<IStoreRecommendation> | null;
    }) => {
      if (recommendation) {
        if (channels.length === 1) {
          // Only WhatsApp
          recommendation.skus?.push(this.getSku(row));
        } else if (isTurn) {
          recommendation.skus?.push(this.getSku(row));
        }
      }
      return recommendation;
    };

    return filteredData.reduce((acc, row) => {
      const channels = [CHANNEL.WhatsApp].includes(row.communicationChannel)
        ? // ? [CHANNEL.WhatsApp, CHANNEL.PushNotification]
          [CHANNEL.WhatsApp]
        : [CHANNEL.PushNotification];

      const params: TypeStoreParams = {
        locationId: row.locationId,
        communicationChannel: row.communicationChannel,
        storeStatus: row.storeStatus,
        storeValue: row.storeValue,
        city: row.city,
        from: row.from ?? null,
        to: row.to ?? null,
      };
      const [wa, pn] = [
        channels.includes(CHANNEL.WhatsApp)
          ? mapLookup({ acc, channel: CHANNEL.WhatsApp, params, row })
          : null,
        channels.includes(CHANNEL.PushNotification)
          ? mapLookup({ acc, channel: CHANNEL.PushNotification, params, row })
          : null,
      ];

      const isWhatsappTurn = // Switch between channels
        ((pn?.skus?.length ?? 0) + (wa?.skus?.length ?? 0)) % 2 === day % 2;

      if (wa) {
        acc.set(
          getStoreKey(row.storeId, CHANNEL.WhatsApp),
          getRecomendationPerChannel({
            channels,
            recommendation: wa,
            row,
            isTurn: isWhatsappTurn,
          }),
        );
      }
      if (pn) {
        acc.set(
          getStoreKey(row.storeId, CHANNEL.PushNotification),
          getRecomendationPerChannel({
            channels,
            recommendation: pn,
            row,
            isTurn: !isWhatsappTurn,
          }),
        );
      }
      return acc;
    }, new Map());
  }

  private assignCampaignAndUtm(
    storeMap: Map<string, Partial<IStoreRecommendation>>,
    day: number,
  ): Map<string, IStoreRecommendation> {
    const newStoreMap = new Map();
    for (const [storeKey, storeRecommendation] of storeMap.entries()) {
      const { params, skus = [] } = storeRecommendation;
      const campaign = this.getCampaignRange(
        params as TypeStoreParams,
        day,
        skus.length,
      );

      if (!campaign) continue;

      const utm = this.getUtm(params as TypeStoreParams, day);
      newStoreMap.set(storeKey, {
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
    const currentSku = {
      skuType: row.recommendationType,
      storeReferenceId,
      referencePromotionId,
      reference: row.reference,
      copy: `--- ${row.reference} ---`,
      discountFormatted: row.discountFormatted,
      image: this.getImageUrl(row),
    };

    const sku = this.skuMapValue.get(this.getOfferCopyKey(currentSku));
    if (!sku) {
      this.skuMapValue.set(this.getOfferCopyKey(currentSku), currentSku);
    }
    return sku ?? currentSku;
  };

  private getImageUrl = ({
    recommendationId,
    recommendationType,
    imageUrl,
  }: IStoreSuggestion): string => {
    if (imageUrl) {
      return imageUrl.replace(
        StoreRecommendationProvider.oldHostName,
        StoreRecommendationProvider.newHostName,
      );
    }
    if (recommendationType === OFFER_TYPE.storeReference) {
      const storeReference =
        StoreRecommendationProvider.storeReferenceMap.get(recommendationId);
      return storeReference?.regular
        ? storeReference.regular
        : (StoreRecommendationProvider.storeReferenceMap.get(null)?.regular ??
            '');
    }
    return (
      StoreRecommendationProvider.storeReferenceMap.get(null)?.regular ?? ''
    );
  };

  private getCampaignRange = (
    { communicationChannel /* , locationId */ }: TypeStoreParams,
    day: number,
    numberOfAvailableSkus: number,
  ): TypeCampaignEntry | null => {
    const generateArray = (from: number, to: number): number[] => {
      const arr = [];
      for (let i = from; i <= to; i++) {
        arr.push(i);
      }
      return arr;
    };

    const adjustToMessageConstraint = (channel: CHANNEL, n: number): number => {
      const MESSAGE_CONSTRAINT = {
        [CHANNEL.WhatsApp]: generateArray(
          CAMPAING.messagesPerCampaign[CHANNEL.WhatsApp].min,
          CAMPAING.messagesPerCampaign[CHANNEL.WhatsApp].max,
        ),
        [CHANNEL.PushNotification]: generateArray(
          CAMPAING.messagesPerCampaign[CHANNEL.PushNotification].min,
          CAMPAING.messagesPerCampaign[CHANNEL.PushNotification].max,
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

    const date = new Date(this.baseDate.getTime() + day * 24 * 60 * 60 * 1000);
    const term = UTILS.formatDDMMYY(date); // DDMMYY
    const campaign = UTILS.campaignToString({
      cityId: UTILS.getCityId(locationId),
      providerId: UTILS.getProvider(locationId),
      asset,
      payer,
      term,
      type,
      segment,
    });
    // const campaign = `${UTILS.getCityId(locationId)}_${UTILS.getProvider(locationId)}_${
    //   asset
    // }_${payer}_${UTILS.formatMMMDD(term)}_${type}_${segment}`;
    const source =
      `${CHANNEL_PROVIDER[communicationChannel]}-campaign`.toLowerCase();
    const content = uuid();
    const medium = asset;
    return {
      campaignName: campaign,
      campaignContent: content,
      campaignTerm: term,
      campaignSource: source,
      campaignMedium: medium,
    };
  };

  public async generateOfferCopyMap(
    includeGenAi: boolean,
  ): Promise<Map<string, string>> {
    for (const [, sku] of this.skuMapValue.entries()) {
      sku.copy =
        sku.skuType === OFFER_TYPE.storeReference
          ? `${this.getPromotionMessage(sku.reference)} con ${sku.discountFormatted} dcto`
          : this.getPromotionMessage(sku.reference);
    }
    return Promise.resolve(this.skuCopyMap);
  }

  private getPromotionMessage(description: string): string {
    const emojis = [
      '🛍️',
      '🔥',
      '📣',
      '🚨',
      '💥',
      '🔔',
      '💰',
      '🤑',
      '💲',
      '🛎️',
      '🛒',
    ];
    const prefix = UTILS.choose(emojis);
    const sufix = UTILS.choose(emojis);
    return String(prefix + ` ${description} ` + sufix);
  }

  //

  public getOfferCopyKey(sku: TypeSku): string {
    return `${sku.skuType}-${
      sku.storeReferenceId ?? sku.referencePromotionId
    }-${
      sku.skuType === OFFER_TYPE.storeReference ? sku.discountFormatted : ''
    }`;
  }

  // Getting function

  public get storeMap(): Map<string, IStoreRecommendation> {
    return this.storeMapValue;
  }
  public get skuMap(): Map<string, TypeSku> {
    return this.skuMapValue;
  }

  public get skuCopyMap(): Map<string, string> {
    return Array.from(this.skuMapValue.values()).reduce((acc, sku) => {
      if (sku.copy) {
        acc.set(this.getOfferCopyKey(sku), sku.copy);
      }
      return acc;
    }, new Map<string, string>());
  }
}
