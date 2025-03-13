import { BigQuery } from '@google-cloud/bigquery';
import { IStoreSuggestion } from './interfaces.ts';

export class BigQueryRepository {
  private readonly bigquery: BigQuery;
  private readonly defaultOptions: object;

  constructor() {
    this.bigquery = new BigQuery();
    this.defaultOptions = {
      location: 'US',
    }
  }
  
  public selectStoreSuggestions(): Promise<IStoreSuggestion[]> {
    const query = `
      SELECT DISTINCT
        country,
        storeStatus,
        storeId,
        city,
        locationId,
        storeReferenceId,
        name,
        reference,
        discountFormatted,
        phone,
        ranking
      FROM \`chiperdw.dbt.BI_D-MessageGenerator\`
      WHERE phone IS NOT NULL
        AND ranking <= 10
        AND (
          (storeStatus = 'Churn' AND daysSinceLastOrderDelivered > 1000000) OR
          (storeStatus <> 'Churn')
        )
        AND phone NOT LIKE '5_9613739%'
        AND phone NOT LIKE '5_9223372%'
      ORDER BY storeId, ranking
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
}
