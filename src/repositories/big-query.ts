import { BigQuery } from '@google-cloud/bigquery';
import { IStoreSuggestion } from './interfaces.ts';
import { IFrequencyParameter } from '../mocks/interfaces.ts';
import { CHANNEL, LOCATION, STORE_STATUS } from '../enums.ts';

export interface ILocationRange {
  locationId: number;
  from?: number;
  to?: number;
}

export class BigQueryRepository {
  private readonly bigquery: BigQuery;
  private readonly defaultOptions: object;
  private readonly masterQuery = `
    SELECT DISTINCT
      MG.country,
      MG.storeStatus,
      MG.storeId,
      MG.city,
      MG.cityId,
      MG.locationId,
      MG.storeReferenceId,
      MG.name,
      MG.reference,
      MG.discountFormatted,
      MG.phone,
      MG.ranking,
      MG.lastValueSegmentation,
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
  }

  public selectStoreSuggestions(
    churnRanges: IFrequencyParameter[],
    channels = [/* CHANNEL.WhatsApp, */ CHANNEL.PushNotification],
    storeStatus = [
      STORE_STATUS.Hibernating,
      STORE_STATUS.Resurrected,
      STORE_STATUS.Retained,
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
      ORDER BY QRY.storeId, QRY.ranking
      LIMIT 500
      OFFSET 5000
    `;

    // console.error('<Query>', query, '</Query>');
    return this.executeQueryBigQuery(query) as Promise<IStoreSuggestion[]>;
  }

  private async executeQueryBigQuery(query: string): Promise<unknown[]> {
    const options = {
      ...this.defaultOptions,
      query,
    };

    try {
      console.error('Big Query');
      const [job] = await this.bigquery.createQueryJob(options);
      console.error(`Job ${job.id} started.`);

      const [rows] = await job.getQueryResults();
      console.error(`Job ${job.id} Results: ${rows.length}`);
      return rows;
    } catch (error) {
      console.error('ERROR:', error);
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
