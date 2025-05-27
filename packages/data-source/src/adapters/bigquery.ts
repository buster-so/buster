import { BigQuery, type BigQueryOptions, type Query } from '@google-cloud/bigquery';
import type { DataSourceIntrospector } from '../introspection/base';
import { BigQueryIntrospector } from '../introspection/bigquery';
import { type BigQueryCredentials, type Credentials, DataSourceType } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

/**
 * BigQuery database adapter
 */
export class BigQueryAdapter extends BaseAdapter {
  private client?: BigQuery;
  private introspector?: BigQueryIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.BigQuery);
    const bigqueryCredentials = credentials as BigQueryCredentials;

    try {
      const options: BigQueryOptions = {
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

  async query(sql: string, params?: QueryParameter[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('BigQuery client not initialized');
    }

    try {
      const options: Query = {
        query: sql,
        useLegacySql: false,
      };

      // Handle parameterized queries - BigQuery uses named parameters
      if (params && params.length > 0) {
        // Convert positional parameters to named parameters
        let processedSql = sql;
        const namedParams: Record<string, QueryParameter> = {};

        // Replace ? placeholders with @param0, @param1, etc.
        let paramIndex = 0;
        processedSql = sql.replace(/\?/g, () => {
          const paramName = `param${paramIndex}`;
          const paramValue = params[paramIndex];
          if (paramValue !== undefined) {
            namedParams[paramName] = paramValue;
          }
          paramIndex++;
          return `@${paramName}`;
        });

        options.query = processedSql;
        options.params = namedParams;
      }

      const [job] = await this.client.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      // Convert BigQuery rows to plain objects
      const resultRows: Record<string, unknown>[] = rows.map((row) => ({ ...row }));

      // BigQuery doesn't provide detailed field metadata in the same way as other databases
      const fields: FieldMetadata[] = [];

      return {
        rows: resultRows,
        rowCount: rows.length,
        fields,
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

  introspect(): DataSourceIntrospector {
    if (!this.introspector) {
      this.introspector = new BigQueryIntrospector('bigquery', this);
    }
    return this.introspector;
  }
}
