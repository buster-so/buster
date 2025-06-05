import snowflake from 'snowflake-sdk';
import type { DataSourceIntrospector } from '../introspection/base';
import { SnowflakeIntrospector } from '../introspection/snowflake';
import { type Credentials, DataSourceType, type SnowflakeCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

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

  async query(sql: string, params?: QueryParameter[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('Snowflake connection not initialized');
    }

    try {
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
          sqlText: sql,
          binds: params as snowflake.Binds,
          complete: (err, stmt, rows) => {
            if (err) {
              reject(new Error(`Snowflake query failed: ${err.message}`));
            } else {
              resolve({ rows: rows || [], statement: stmt });
            }
          },
        });
      });

      const fields: FieldMetadata[] =
        result.statement?.getColumns?.()?.map((col) => ({
          name: col.getName(),
          type: col.getType(),
          nullable: col.isNullable(),
          scale: col.getScale() > 0 ? col.getScale() : undefined,
          precision: col.getPrecision() > 0 ? col.getPrecision() : undefined,
        })) || [];

      return {
        rows: result.rows,
        rowCount: result.rows.length,
        fields,
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
          complete: (err) => {
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
        this.connection.destroy((err) => {
          if (err) {
            console.warn(`Error closing Snowflake connection: ${err.message}`);
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
