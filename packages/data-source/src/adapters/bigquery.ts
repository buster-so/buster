import { BigQuery, type BigQueryOptions, type Query } from '@google-cloud/bigquery';
import { BaseCancellationController, type CancellableQuery } from '../cancellation/index.js';
import { QueryCancellationError } from '../errors/data-source-errors';
import type { DataSourceIntrospector } from '../introspection/base';
import { BigQueryIntrospector } from '../introspection/bigquery';
import { type BigQueryCredentials, type Credentials, DataSourceType } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

class BigQueryCancellableQuery implements CancellableQuery<AdapterQueryResult> {
  private cancelled = false;
  private controller = new BaseCancellationController();
  private job?: unknown;

  constructor(
    private client: BigQuery,
    private sql: string,
    private params?: QueryParameter[],
    private maxRows?: number,
    private timeout?: number
  ) {}

  async execute(): Promise<AdapterQueryResult> {
    if (this.cancelled) {
      throw new QueryCancellationError(this.sql);
    }

    const options: Query = {
      query: this.sql,
      useLegacySql: false,
    };

    if (this.timeout || this.timeout === 0) {
      options.jobTimeoutMs = this.timeout;
    } else {
      options.jobTimeoutMs = 60000;
    }

    let hasMoreRows = false;
    if (this.maxRows && this.maxRows > 0) {
      options.maxResults = this.maxRows + 1;
    }

    if (this.params && this.params.length > 0) {
      let processedSql = this.sql;
      const namedParams: Record<string, QueryParameter> = {};

      let paramIndex = 0;
      processedSql = this.sql.replace(/\?/g, () => {
        const paramName = `param${paramIndex}`;
        const paramValue = this.params?.[paramIndex];
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
    this.job = job;

    this.controller.onCancellation(async () => {
      if (this.job) {
        try {
          await (this.job as any).cancel();
        } catch (error) {
          console.warn('BigQuery job cancellation warning:', error);
        }
      }
    });

    if (this.cancelled) {
      await this.cancel();
      throw new QueryCancellationError(this.sql);
    }

    const [rows] = await job.getQueryResults();

    if (this.cancelled) {
      throw new QueryCancellationError(this.sql);
    }

    let resultRows: Record<string, unknown>[] = rows.map((row) => ({ ...row }));

    if (this.maxRows && resultRows.length > this.maxRows) {
      hasMoreRows = true;
      resultRows = resultRows.slice(0, this.maxRows);
    }

    const fields: FieldMetadata[] = [];

    return {
      rows: resultRows,
      rowCount: resultRows.length,
      fields,
      hasMoreRows,
    };
  }

  async cancel(): Promise<void> {
    this.cancelled = true;
    await this.controller.cancel();
  }

  async onTimeout(timeoutMs: number): Promise<AdapterQueryResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(async () => {
        await this.cancel();
        reject(new QueryCancellationError(this.sql));
      }, timeoutMs);
    });

    return Promise.race([this.execute(), timeoutPromise]);
  }
}

/**
 * BigQuery database adapter
 */
export class BigQueryAdapter extends BaseAdapter {
  private client?: BigQuery | undefined;
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

  async query(
    sql: string,
    params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('BigQuery client not initialized');
    }

    try {
      const options: Query = {
        query: sql,
        useLegacySql: false,
      };

      // Add timeout if specified (default: 60 seconds)
      if (timeout || timeout === 0) {
        options.jobTimeoutMs = timeout;
      } else {
        options.jobTimeoutMs = 60000; // 60 second default for analytical queries
      }

      // Apply row limit if specified
      let hasMoreRows = false;
      if (maxRows && maxRows > 0) {
        // BigQuery supports maxResults natively
        options.maxResults = maxRows + 1;
      }

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
      let resultRows: Record<string, unknown>[] = rows.map((row) => ({ ...row }));

      // Check if we have more rows than requested
      if (maxRows && resultRows.length > maxRows) {
        hasMoreRows = true;
        // Remove the extra row we fetched to check for more
        resultRows = resultRows.slice(0, maxRows);
      }

      // BigQuery doesn't provide detailed field metadata in the same way as other databases
      const fields: FieldMetadata[] = [];

      return {
        rows: resultRows,
        rowCount: resultRows.length,
        fields,
        hasMoreRows,
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
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new BigQueryIntrospector('bigquery', this);
    }
    return this.introspector;
  }

  createCancellableQuery(
    sql: string,
    params?: QueryParameter[]
  ): CancellableQuery<AdapterQueryResult> {
    this.ensureConnected();
    if (!this.client) {
      throw new Error('BigQuery client not initialized');
    }
    return new BigQueryCancellableQuery(this.client, sql, params);
  }

  async cancelQuery(_queryId: string): Promise<void> {
    console.warn('BigQuery cancelQuery by ID not implemented - use CancellableQuery instead');
  }

  isQueryCancellable(): boolean {
    return true;
  }
}
