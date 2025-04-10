import { BigQuery } from '@google-cloud/bigquery';
import { IStoreSuggestion, OFFER_TYPE } from './interfaces.ts';
import { IFrequencyParameter } from '../mocks/interfaces.ts';
import { CHANNEL, LOCATION, STORE_STATUS } from '../enums.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';

export interface ILocationRange {
  locationId: number;
  from?: number;
  to?: number;
}

export class BigQueryRepository {
  private readonly bigquery: BigQuery;
  private readonly defaultOptions: object;
  private readonly logger: LoggingProvider;
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
  private readonly masterQuery = `
    SELECT DISTINCT
      MG.country,
      MG.storeStatus,
      MG.storeId,
      MG.city,
      MG.cityId,
      MG.locationId,
      IF(MOD(MG.storeReferenceId, 10) = 0, '${OFFER_TYPE.referencePromotion}', '${OFFER_TYPE.storeReference}') as recommendationType,
      IF(MOD(MG.storeReferenceId, 10) = 0, MG.storeReferenceId + 1000000, MG.storeReferenceId) as recommendationId,
      MG.name,
      IF(MOD(MG.storeReferenceId, 10) = 0, CONCAT('PROMO: ', MG.reference), MG.reference) as reference,
      MG.discountFormatted,
      MG.phone,
      MG.ranking,
      ${this.storeValueSegment} as lastValueSegmentation,
      MG.communicationChannel,
      IFNULL(MG.daysSinceLastOrderDelivered, 0) as daysSinceLastOrderDelivered,
      MG.warehouseId
    FROM \`chiperdw.dbt.BI_D-MessageGenerator\` MG
    WHERE MG.phone IS NOT NULL
      -- AND MG.ranking <= 10
      AND MG.phone NOT LIKE '5_9613739%'
      AND MG.phone NOT LIKE '5_9223372%'
  `;

  constructor() {
    this.bigquery = new BigQuery();
    this.defaultOptions = {
      location: 'US',
    };
    this.logger = new LoggingProvider({ context: BigQueryRepository.name });
  }

  public selectStoreSuggestions(
    churnRanges: IFrequencyParameter[],
    channels = [/* CHANNEL.WhatsApp, */ CHANNEL.PushNotification],
    storeStatus = [
      STORE_STATUS.Hibernating,
      STORE_STATUS.Resurrected,
      STORE_STATUS.Retained,
      STORE_STATUS.New,
    ],
  ): Promise<IStoreSuggestion[]> {
    const query = `
      WITH LSR AS (
        ${this.queryLocationStatusRange(churnRanges)}),
      QRY AS (
        ${this.masterQuery} AND MG.communicationChannel in ('${channels.join("','")}')
      )
      SELECT DISTINCT
        QRY.*,
        IF(QRY.storeStatus IN ('${storeStatus.join("','")}')
          , REPLACE(QRY.lastValueSegmentation, '-', '')
          , NULL
        ) as storeValue,
        LSR.fromDays as \`from\`,
        LSR.toDays as \`to\`,
        LSR.rangeName
      FROM QRY
      INNER JOIN LSR
         ON QRY.daysSinceLastOrderDelivered
            BETWEEN IFNULL(LSR.fromDays, QRY.daysSinceLastOrderDelivered)
                AND IFNULL(LSR.toDays, QRY.daysSinceLastOrderDelivered)
        AND QRY.locationId = LSR.locationId
        AND QRY.storeStatus = LSR.storeStatus
        AND QRY.recommendationId IS NOT NULL
      ORDER BY QRY.storeId, QRY.ranking
      -- LIMIT 750
      -- OFFSET 7250
    `;

    this.logger.log({
      functionName: this.selectStoreSuggestions.name,
      message: 'Executing BigQuery',
      data: {
        query,
        channels,
        storeStatus,
        churnRanges,
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
    locationRanges: IFrequencyParameter[],
  ): string {
    const select = ({
      from,
      to,
      locationId,
      storeStatus,
    }: Partial<IFrequencyParameter>): string => {
      const name = from || to ? `'${from ?? 'Any'}to${to ?? 'Any'}'` : 'NULL';
      return `SELECT ${locationId} AS locationId, '${
        storeStatus
      }' as storeStatus, ${from ?? 'NULL'} AS fromDays, ${to ?? 'NULL'} AS toDays, ${
        name
      } AS rangeName`;
    };

    if (!locationRanges.length)
      return select({
        locationId: LOCATION._default,
        storeStatus: STORE_STATUS._default,
      });

    return locationRanges
      .map((locationRange) => select(locationRange))
      .join(' UNION DISTINCT ');
  }
}
