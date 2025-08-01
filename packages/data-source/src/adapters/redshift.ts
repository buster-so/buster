import { Client, type ClientConfig } from 'pg';
import Cursor from 'pg-cursor';
import { BaseCancellationController, type CancellableQuery } from '../cancellation/index.js';
import { QueryCancellationError } from '../errors/data-source-errors';
import type { DataSourceIntrospector } from '../introspection/base';
import { RedshiftIntrospector } from '../introspection/redshift';
import { type Credentials, DataSourceType, type RedshiftCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

// Internal types for pg-cursor that aren't exported
interface CursorResult {
  fields: Array<{
    name: string;
    dataTypeID: number;
    dataTypeSize: number;
  }>;
}

interface CursorWithResult extends Cursor {
  _result?: CursorResult;
}

class RedshiftCancellableQuery implements CancellableQuery<AdapterQueryResult> {
  private cancelled = false;
  private controller = new BaseCancellationController();

  constructor(
    private client: Client,
    private sql: string,
    private params?: QueryParameter[],
    private maxRows?: number,
    private timeout?: number
  ) {}

  async execute(): Promise<AdapterQueryResult> {
    if (this.cancelled) {
      throw new QueryCancellationError(this.sql);
    }

    this.controller.onCancellation(async () => {
      try {
        await this.client.query('SELECT pg_cancel_backend(pg_backend_pid())');
      } catch (error) {
        console.warn('Redshift query cancellation warning:', error);
      }
    });

    const timeoutMs = this.timeout || 60000;
    await this.client.query(`SET statement_timeout = ${timeoutMs}`);

    if (!this.maxRows || this.maxRows <= 0) {
      const result = await this.client.query(this.sql, this.params);

      if (this.cancelled) {
        throw new QueryCancellationError(this.sql);
      }

      const fields: FieldMetadata[] =
        result.fields?.map((field) => ({
          name: field.name,
          type: `redshift_type_${field.dataTypeID}`,
          nullable: true,
          length: field.dataTypeSize > 0 ? field.dataTypeSize : 0,
        })) || [];

      return {
        rows: result.rows,
        rowCount: result.rowCount || result.rows.length,
        fields,
        hasMoreRows: false,
      };
    }

    const cursor = this.client.query(new Cursor(this.sql, this.params)) as CursorWithResult;
    const rows: Record<string, unknown>[] = [];
    let hasMoreRows = false;
    let fields: FieldMetadata[] = [];

    const batchSize = Math.min(this.maxRows, 1000);
    let totalRead = 0;

    try {
      while (totalRead < this.maxRows) {
        if (this.cancelled) {
          throw new QueryCancellationError(this.sql);
        }

        const remainingRows = this.maxRows - totalRead;
        const readSize = Math.min(batchSize, remainingRows) + 1;

        const batchRows = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
          cursor.read(readSize, (err, batchRows) => {
            if (err) {
              reject(err);
            } else {
              resolve(batchRows);
            }
          });
        });

        if (batchRows.length === 0) {
          break;
        }

        if (fields.length === 0 && cursor._result?.fields) {
          fields = cursor._result.fields.map((field) => ({
            name: field.name,
            type: `redshift_type_${field.dataTypeID}`,
            nullable: true,
            length: field.dataTypeSize > 0 ? field.dataTypeSize : 0,
          }));
        }

        if (totalRead + batchRows.length > this.maxRows) {
          hasMoreRows = true;
          rows.push(...batchRows.slice(0, this.maxRows - totalRead));
          break;
        }

        rows.push(...batchRows);
        totalRead += batchRows.length;

        if (batchRows.length < readSize) {
          break;
        }
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        cursor.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    if (this.cancelled) {
      throw new QueryCancellationError(this.sql);
    }

    return {
      rows,
      rowCount: rows.length,
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
 * Redshift database adapter (PostgreSQL-compatible)
 */
export class RedshiftAdapter extends BaseAdapter {
  private client?: Client | undefined;
  private introspector?: RedshiftIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Redshift);
    const redshiftCredentials = credentials as RedshiftCredentials;

    try {
      const config: ClientConfig = {
        host: redshiftCredentials.host,
        port: redshiftCredentials.port || 5439, // Default Redshift port
        database: redshiftCredentials.database,
        user: redshiftCredentials.username,
        password: redshiftCredentials.password,
        ssl: redshiftCredentials.ssl ?? true, // SSL is typically required for Redshift
      };

      // Handle connection timeout - default to 60 seconds for serverless
      config.connectionTimeoutMillis = redshiftCredentials.connection_timeout || 60000;

      // Set default schema if provided
      if (redshiftCredentials.schema) {
        config.options = `-c search_path=${redshiftCredentials.schema}`;
      }

      this.client = new Client(config);
      await this.client.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Redshift client: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      throw new Error('Redshift client not initialized');
    }

    try {
      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;
      await this.client.query(`SET statement_timeout = ${timeoutMs}`);

      // If no maxRows specified, use regular query
      if (!maxRows || maxRows <= 0) {
        const result = await this.client.query(sql, params);

        const fields: FieldMetadata[] =
          result.fields?.map((field) => ({
            name: field.name,
            type: `redshift_type_${field.dataTypeID}`, // Redshift type ID
            nullable: true, // Redshift doesn't provide this info directly
            length: field.dataTypeSize > 0 ? field.dataTypeSize : 0,
          })) || [];

        return {
          rows: result.rows,
          rowCount: result.rowCount || result.rows.length,
          fields,
          hasMoreRows: false,
        };
      }

      // Use cursor for SELECT queries with maxRows
      const cursor = this.client.query(new Cursor(sql, params)) as CursorWithResult;
      const rows: Record<string, unknown>[] = [];
      let hasMoreRows = false;
      let fields: FieldMetadata[] = [];

      // Read rows in batches
      const batchSize = Math.min(maxRows, 1000); // Read up to 1000 rows at a time
      let totalRead = 0;

      while (totalRead < maxRows) {
        const remainingRows = maxRows - totalRead;
        const readSize = Math.min(batchSize, remainingRows) + 1; // Read one extra to check for more

        const batchRows = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
          cursor.read(readSize, (err, batchRows) => {
            if (err) {
              reject(err);
            } else {
              resolve(batchRows);
            }
          });
        });

        if (batchRows.length === 0) {
          break; // No more rows
        }

        // Extract field metadata from cursor on first batch
        if (fields.length === 0 && cursor._result?.fields) {
          fields = cursor._result.fields.map((field) => ({
            name: field.name,
            type: `redshift_type_${field.dataTypeID}`,
            nullable: true,
            length: field.dataTypeSize > 0 ? field.dataTypeSize : 0,
          }));
        }

        // Check if we have more rows than requested
        if (totalRead + batchRows.length > maxRows) {
          hasMoreRows = true;
          rows.push(...batchRows.slice(0, maxRows - totalRead));
          break;
        }

        rows.push(...batchRows);
        totalRead += batchRows.length;

        // If we got fewer rows than requested, we've reached the end
        if (batchRows.length < readSize) {
          break;
        }
      }

      // Close the cursor
      await new Promise<void>((resolve, reject) => {
        cursor.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      return {
        rows,
        rowCount: rows.length,
        fields,
        hasMoreRows,
      };
    } catch (error) {
      throw new Error(
        `Redshift query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test connection by running a simple query
      await this.client.query('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
      } catch (error) {
        // Log error but don't throw - connection is being closed anyway
        console.error('Error closing Redshift connection:', error);
      }
      this.client = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.Redshift;
  }

  introspect(): DataSourceIntrospector {
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new RedshiftIntrospector('redshift', this);
    }
    return this.introspector;
  }

  createCancellableQuery(
    sql: string,
    params?: QueryParameter[]
  ): CancellableQuery<AdapterQueryResult> {
    this.ensureConnected();
    if (!this.client) {
      throw new Error('Redshift client not initialized');
    }
    return new RedshiftCancellableQuery(this.client, sql, params);
  }

  async cancelQuery(_queryId: string): Promise<void> {
    console.warn('Redshift cancelQuery by ID not implemented - use CancellableQuery instead');
  }

  isQueryCancellable(): boolean {
    return true;
  }
}
