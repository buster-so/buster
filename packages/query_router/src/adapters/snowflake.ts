import snowflake from 'snowflake-sdk';
import { type Credentials, DataSourceType, type SnowflakeCredentials } from '../types/credentials';
import { type AdapterQueryResult, BaseAdapter } from './base';

/**
 * Snowflake database adapter
 */
export class SnowflakeAdapter extends BaseAdapter {
  private connection?: snowflake.Connection;

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
        this.connection!.connect((err) => {
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

  async query(sql: string, params?: any[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('Snowflake connection not initialized');
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.connection!.execute({
          sqlText: sql,
          binds: params,
          complete: (err, stmt, rows) => {
            if (err) {
              reject(new Error(`Snowflake query failed: ${err.message}`));
            } else {
              resolve({ rows, statement: stmt });
            }
          },
        });
      });

      return {
        rows: result.rows || [],
        rowCount: result.rows?.length || 0,
        fields:
          result.statement?.getColumns?.()?.map((col: any) => ({
            name: col.getName(),
            type: col.getType(),
            nullable: col.isNullable(),
            scale: col.getScale(),
            precision: col.getPrecision(),
          })) || [],
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
        this.connection!.execute({
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
        this.connection!.destroy((err) => {
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
}
