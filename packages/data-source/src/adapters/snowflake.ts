import snowflake from 'snowflake-sdk';
import type { DataSourceIntrospector } from '../introspection/base';
import { SnowflakeIntrospector } from '../introspection/snowflake';
import { type Credentials, DataSourceType, type SnowflakeCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

// Type definitions for Snowflake SDK callbacks
interface SnowflakeError {
  message: string;
  code?: string;
}

interface SnowflakeStatement {
  getColumns?: () => Array<{
    getName(): string;
    getType(): string;
    isNullable(): boolean;
    getScale(): number;
    getPrecision(): number;
  }>;
}

// Configure Snowflake SDK to disable logging
snowflake.configure({
  logLevel: 'OFF',
  additionalLogToConsole: false,
});

/**
 * Snowflake database adapter
 */
export class SnowflakeAdapter extends BaseAdapter {
  private connection?: snowflake.Connection;
  private introspector?: SnowflakeIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Snowflake);
    const snowflakeCredentials = credentials as SnowflakeCredentials;

    try {
      const connectionOptions: snowflake.ConnectionOptions = {
        account: snowflakeCredentials.account_id,
        username: snowflakeCredentials.username,
        password: snowflakeCredentials.password,
        warehouse: snowflakeCredentials.warehouse_id,
        database: snowflakeCredentials.default_database,
      };

      // Add optional parameters
      if (snowflakeCredentials.role) {
        connectionOptions.role = snowflakeCredentials.role;
      }

      if (snowflakeCredentials.default_schema) {
        connectionOptions.schema = snowflakeCredentials.default_schema;
      }

      this.connection = snowflake.createConnection(connectionOptions);

      // Connect to Snowflake
      await new Promise<void>((resolve, reject) => {
        if (!this.connection) {
          reject(new Error('Failed to create Snowflake connection'));
          return;
        }
        this.connection.connect((err) => {
          if (err) {
            reject(new Error(`Failed to connect to Snowflake: ${err.message}`));
          } else {
            resolve();
          }
        });
      });

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Snowflake client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(
    sql: string,
    params?: QueryParameter[],
    maxRows?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('Snowflake connection not initialized');
    }

    try {
      let limitedSql = sql;
      let hasMoreRows = false;

      // Apply row limit if specified
      if (maxRows && maxRows > 0) {
        // Wrap the original query to apply LIMIT
        // Using a subquery to avoid issues with complex queries
        limitedSql = `SELECT * FROM (${sql}) AS limited_query LIMIT ${maxRows + 1}`;
      }

      interface SnowflakeQueryResult {
        rows: Record<string, unknown>[];
        statement: {
          getColumns?: () => Array<{
            getName(): string;
            getType(): string;
            isNullable(): boolean;
            getScale(): number;
            getPrecision(): number;
          }>;
        };
      }

      const result = await new Promise<SnowflakeQueryResult>((resolve, reject) => {
        if (!this.connection) {
          reject(new Error('Snowflake connection not initialized'));
          return;
        }
        this.connection.execute({
          sqlText: limitedSql,
          binds: params as snowflake.Binds,
          complete: (
            err: SnowflakeError | null,
            stmt: SnowflakeStatement,
            rows: Record<string, unknown>[]
          ) => {
            if (err) {
              reject(new Error(`Snowflake query failed: ${err.message}`));
            } else {
              resolve({ rows: rows || [], statement: stmt });
            }
          },
        });
      });

      // Check if we have more rows than requested
      let rows = result.rows;
      if (maxRows && rows.length > maxRows) {
        hasMoreRows = true;
        // Remove the extra row we fetched to check for more
        rows = rows.slice(0, maxRows);
      }

      const fields: FieldMetadata[] =
        result.statement?.getColumns?.()?.map((col) => ({
          name: col.getName(),
          type: col.getType(),
          nullable: col.isNullable(),
          scale: col.getScale() > 0 ? col.getScale() : undefined,
          precision: col.getPrecision() > 0 ? col.getPrecision() : undefined,
        })) || [];

      return {
        rows,
        rowCount: rows.length,
        fields,
        hasMoreRows,
      };
    } catch (error) {
      throw new Error(
        `Snowflake query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }

      // Test connection by running a simple query
      await new Promise<void>((resolve, reject) => {
        if (!this.connection) {
          reject(new Error('Snowflake connection not initialized'));
          return;
        }
        this.connection.execute({
          sqlText: 'SELECT 1 as test',
          complete: (err: SnowflakeError | null) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          },
        });
      });

      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await new Promise<void>((resolve) => {
        if (!this.connection) {
          resolve();
          return;
        }
        this.connection.destroy((err: SnowflakeError | null) => {
          if (err) {
            // Log error but don't fail the close operation
            // Using a simple approach that works in most environments
          }
          resolve();
        });
      });
      this.connection = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.Snowflake;
  }

  introspect(): DataSourceIntrospector {
    if (!this.introspector) {
      this.introspector = new SnowflakeIntrospector('snowflake', this);
    }
    return this.introspector;
  }
}
