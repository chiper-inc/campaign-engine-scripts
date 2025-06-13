import { BigQuery } from '@google-cloud/bigquery';
import { IStoreSuggestion, OFFER_TYPE } from './interfaces.ts';
import { IFrequencyParameter } from '../mocks/interfaces.ts';
import { CHANNEL, LOCATION, STORE_STATUS } from '../enums.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';
import { messagesPerCampaign } from '../parameters/campaigns.ts';

export class BigQueryRepository {
  private readonly bigquery: BigQuery;
  private readonly defaultOptions: object;
  private readonly logger: LoggingProvider;
  private readonly maxRanking =
    messagesPerCampaign[CHANNEL.PushNotification].max >
    messagesPerCampaign[CHANNEL.WhatsApp].max
      ? messagesPerCampaign[CHANNEL.PushNotification].max
      : messagesPerCampaign[CHANNEL.WhatsApp].max;
  private readonly storeValueSegment = `
    IF (MG.storeStatus = 'New', 
      CASE
        WHEN MG.numDeliveredOrders = 0 THEN NULL
        WHEN MG.numDeliveredOrders = 1 THEN 'Low'
        WHEN MG.numDeliveredOrders = 2 THEN 'MidLow'
        WHEN MG.numDeliveredOrders = 3 THEN 'MidHigh'
      ELSE 'High'
      END,
      MG.lastValueSegmentation
    )`;

  private locationList = [
    LOCATION.CMX,
    LOCATION.CLO,
    LOCATION.BAQ,
    LOCATION.BOG,
    LOCATION.MDE,
    LOCATION.BGA,
    LOCATION.SCL,
    LOCATION.VLN,
    LOCATION.SAO,
  ].join(',');
  private readonly communicationChannel = `IF(MG.locationId IN (${this.locationList}), 'Push Notification', MG.communicationChannel)`;
  private readonly masterQuery = `
    SELECT DISTINCT
      MG.country,
      MG.storeStatus,
      MG.customerId AS storeId,
      MG.city,
      MG.cityId,
      MG.locationId,
      IF(MG.referencePromotionId IS NOT NULL, '${OFFER_TYPE.referencePromotion}', '${OFFER_TYPE.storeReference}') as recommendationType,
      IFNULL(MG.referencePromotionId, MG.storeReferenceId) as recommendationId,
      MG.name,
      IF(MG.referencePromotionId IS NOT NULL, MG.campaignDescription, MG.reference) as reference,
      IFNULL(MG.bannerUrl, MG.referenceImageUrl) as imageUrl,
      MG.discountFormatted,
      MG.phone,
      MG.ranking,
      IFNULL(MG.rankingStore, NULL) AS rankingStore,
      IFNULL(MG.rankingSegment, NULL) AS rankingSegment,
      ${this.storeValueSegment} AS lastValueSegmentation,
      ${this.communicationChannel} AS communicationChannel,
      IFNULL(MG.daysSinceLastOrderDelivered, 0) AS daysSinceLastOrderDelivered,
      MG.warehouseId
    FROM \`chiperdw.dbt.BI_D-MessageGenerator\` MG
    WHERE MG.phone IS NOT NULL
      AND MG.ranking <= ${this.maxRanking}
      AND ((MG.discountFormatted <> '0%' and MG.storeReferenceId IS NOT NULL) OR (MG.referencePromotionId IS NOT NULL))
      AND MG.phone NOT LIKE '5_9613739%'
      AND MG.locationId IN (${this.locationList})
      AND MG.phone NOT LIKE '5_9223372%'
  `;

  constructor() {
    this.bigquery = new BigQuery();
    this.defaultOptions = {
      location: 'US',
    };
    this.logger = new LoggingProvider({
      context: BigQueryRepository.name,
      levels: LoggingProvider.WARN | LoggingProvider.ERROR,
    });
  }

  public selectStoreSuggestions(
    {
      frequencyParameters,
      channels = [CHANNEL.WhatsApp, CHANNEL.PushNotification],
      storeStatus = [
        STORE_STATUS.Hibernating,
        STORE_STATUS.Resurrected,
        STORE_STATUS.Retained,
        STORE_STATUS.New,
      ],
      day,
    }: {
      frequencyParameters: IFrequencyParameter[];
      channels?: CHANNEL[];
      storeStatus?: STORE_STATUS[];
      day: number;
    },
    {
      limit = undefined,
      offset = undefined,
    }: { limit?: number; offset?: number } = {},
  ): Promise<IStoreSuggestion[]> {
    const query = `
      WITH LSR AS (
        ${this.queryLocationStatusRange(frequencyParameters)}),
      QRY AS (
        ${this.masterQuery} AND MG.communicationChannel in ('${channels.join("','")}')
      )
      SELECT DISTINCT
        QRY.*,
        IF(QRY.storeStatus IN ('${storeStatus.join("','")}')
          , REPLACE(QRY.lastValueSegmentation, '-', '')
          , NULL
        ) AS storeValue,
        LSR.fromDays AS \`from\`,
        LSR.toDays AS \`to\`,
        LSR.rangeName,
        LSR.valueName
      FROM QRY
      INNER JOIN LSR
         ON QRY.daysSinceLastOrderDelivered
            BETWEEN IFNULL(LSR.fromDays, QRY.daysSinceLastOrderDelivered)
                AND IFNULL(LSR.toDays, QRY.daysSinceLastOrderDelivered)
        AND IFNULL(LSR.storeValue, IFNULL(QRY.lastValueSegmentation, 'NULL'))
          = IFNULL(QRY.lastValueSegmentation, 'NULL')
        AND QRY.locationId = LSR.locationId
        AND QRY.storeStatus = LSR.storeStatus
        AND QRY.communicationChannel = LSR.communicationChannel
      WHERE 1 = 1
        -- Select only the stores that match the frequency
        AND MOD(QRY.storeId, LSR.frequency) = MOD(${day}, LSR.frequency) 
        -- AND QRY.communicationChannel = 'Push Notification'
        -- AND QRY.recommendationId IS NOT NULL
      ORDER BY QRY.storeId, QRY.ranking
      ${!limit ? '' : `LIMIT ${limit}`}
      ${!offset ? '' : `OFFSET ${offset}`}
    `;

    this.logger.log({
      functionName: this.selectStoreSuggestions.name,
      message: 'Executing BigQuery',
      data: {
        query,
        channels,
        storeStatus,
        frequencyParameters,
      },
    });
    return this.executeQueryBigQuery(query) as Promise<IStoreSuggestion[]>;
  }

  private async executeQueryBigQuery(query: string): Promise<unknown[]> {
    const functionName = this.executeQueryBigQuery.name;
    const options = {
      ...this.defaultOptions,
      query,
    };

    try {
      this.logger.warn({
        message: 'Executing BigQuery',
        functionName,
      });
      const [job] = await this.bigquery.createQueryJob(options);
      this.logger.warn({
        message: `Job ${job.id} started.`,
        functionName,
      });

      const [rows] = await job.getQueryResults();
      this.logger.warn({
        message: `Job ${job.id} Results: ${rows.length}`,
        functionName,
      });
      return rows;
    } catch (error) {
      this.logger.error({
        message: 'Error executing BigQuery',
        functionName,
        error: new Error(error as string),
        data: { query },
      });
      throw error;
    }
  }

  private queryLocationStatusRange(
    frequencyParameters: IFrequencyParameter[],
  ): string {
    const select = ({
      communicationChannel,
      from,
      to,
      locationId,
      storeStatus,
      storeValue,
      frequency,
    }: IFrequencyParameter): string => {
      const name = from || to ? `'${from ?? 'Any'}to${to ?? 'Any'}'` : 'NULL';
      return `SELECT ${locationId} AS locationId, '${
        storeStatus
      }' AS storeStatus, CAST(${from ?? 'NULL'} AS INT64) AS fromDays, CAST(${to ?? 'NULL'} AS INT64) AS toDays, ${
        name
      } AS rangeName, CAST(${storeValue ?? 'NULL'} AS STRING) AS storeValue, '${storeValue ?? 'Any'}' AS valueName, CAST(${
        frequency
      } AS INT64) AS frequency, 
        '${communicationChannel}' AS communicationChannel`;
    };

    if (!frequencyParameters.length)
      return select({
        locationId: LOCATION._default,
        storeStatus: STORE_STATUS._default,
        frequency: 1,
        communicationChannel: CHANNEL.WhatsApp,
      });

    return frequencyParameters
      .filter(({ frequency }) => frequency) // Filter out undefined or cero frequencies
      .map((frequencyParameter) => select(frequencyParameter))
      .join(' UNION DISTINCT ');
  }
}
