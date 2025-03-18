import { BigQuery } from '@google-cloud/bigquery';
import { IStoreSuggestion } from './interfaces.ts';
import { IFrequencyParameter } from '../parameters.ts';
import { LOCATION, STORE_STATUS } from '../enums.ts';

export interface ILocationRange {
  locationId: number;
  from?: number;
  to?: number;
}

export class BigQueryRepository {
  private readonly bigquery: BigQuery;
  private readonly defaultOptions: object;

  constructor() {
    this.bigquery = new BigQuery();
    this.defaultOptions = {
      location: 'US',
    };
  }

  public selectStoreSuggestions(
    churnRanges: IFrequencyParameter[],
  ): Promise<IStoreSuggestion[]> {
    const query = `
      WITH LSR AS (
        ${this.queryLocationStatusRange(churnRanges)}
      ) SELECT DISTINCT
        MG.country,
        MG.storeStatus,
        MG.storeId,
        MG.city,
        MG.locationId,
        MG.storeReferenceId,
        MG.name,
        MG.reference,
        MG.discountFormatted,
        MG.phone,
        MG.ranking,
        LSR.fromDays AS \`from\`,
        LSR.toDays AS \`to\`,
        LSR.rangeName
      FROM \`chiperdw.dbt.BI_D-MessageGenerator\` MG
      INNER JOIN LSR
         ON IFNULL(MG.daysSinceLastOrderDelivered, 0)
            BETWEEN IFNULL(LSR.fromDays, IFNULL(MG.daysSinceLastOrderDelivered, 0))
                AND IFNULL(LSR.toDays, IFNULL(MG.daysSinceLastOrderDelivered, 0))
        AND MG.locationId = LSR.locationId
        AND MG.storeStatus = LSR.storeStatus
      WHERE MG.phone IS NOT NULL
        AND MG.ranking <= 7
        AND MG.phone NOT LIKE '5_9613739%'
        AND MG.phone NOT LIKE '5_9223372%'
      ORDER BY MG.storeId, MG.ranking
      LIMIT 5000000`;

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
      .join('\nUNION DISTINCT\n');
  }
}
