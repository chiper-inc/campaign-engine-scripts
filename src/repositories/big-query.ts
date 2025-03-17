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
      FROM \`chiperdw.dbt.BI_D-MessageGenerator\` MG
      LEFT JOIN LSR
         ON daysSinceLastOrderDelivered BETWEEN LSR.fromDays AND LSR.toDays
        AND MG.locationId = LSR.locationId
        AND MG.storeStatus = LSR.storeStatus
      WHERE MG.phone IS NOT NULL
        AND MG.ranking <= 10
        AND (
          (MG.storeStatus = 'Churn' AND LSR.rangeName IS NOT NULL) OR
          (MG.storeStatus <> 'Churn')
        )
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
    }: Partial<IFrequencyParameter>): string => {
      const storeStatus = "'Churn'";
      const name = from || to ? `'${from ?? 'Any'}-${to ?? 'Any'}'` : 'NULL';
      return `SELECT ${locationId} AS locationId, ${
        storeStatus
      } as storeStatus, ${from ?? 0} AS fromDays, ${to ?? 10000} AS toDays,${
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
