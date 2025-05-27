import { BigQuery } from '@google-cloud/bigquery';
import { type BigQueryCredentials, type Credentials, DataSourceType } from '../types/credentials';
import { type AdapterQueryResult, BaseAdapter } from './base';

/**
 * BigQuery database adapter
 */
export class BigQueryAdapter extends BaseAdapter {
  private client?: BigQuery;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.BigQuery);
    const bigqueryCredentials = credentials as BigQueryCredentials;

    try {
      const options: any = {
        projectId: bigqueryCredentials.project_id,
      };

      // Handle service account authentication
      if (bigqueryCredentials.service_account_key) {
        try {
          // Try to parse as JSON string
          const keyData = JSON.parse(bigqueryCredentials.service_account_key);
          options.credentials = keyData;
        } catch {
          // If parsing fails, treat as file path
          options.keyFilename = bigqueryCredentials.service_account_key;
        }
      } else if (bigqueryCredentials.key_file_path) {
        options.keyFilename = bigqueryCredentials.key_file_path;
      }

      if (bigqueryCredentials.location) {
        options.location = bigqueryCredentials.location;
      }

      this.client = new BigQuery(options);
      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize BigQuery client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(sql: string, params?: any[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('BigQuery client not initialized');
    }

    try {
      const options: any = {
        query: sql,
        useLegacySql: false,
      };

      // Handle parameterized queries
      if (params && params.length > 0) {
        options.params = params;
      }

      const [job] = await this.client.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      return {
        rows: rows.map((row: any) => ({ ...row })), // Convert BigQuery rows to plain objects
        rowCount: rows.length,
        fields: [], // BigQuery doesn't provide field metadata in the same way
      };
    } catch (error) {
      throw new Error(
        `BigQuery query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test connection by running a simple query
      const [job] = await this.client.createQueryJob({
        query: 'SELECT 1 as test',
        useLegacySql: false,
      });

      await job.getQueryResults();
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // BigQuery client doesn't require explicit closing
    this.connected = false;
    this.client = undefined;
  }

  getDataSourceType(): string {
    return DataSourceType.BigQuery;
  }
}
