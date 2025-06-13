import snowflake from 'snowflake-sdk';
import type { DataSourceIntrospector } from '../introspection/base';
import { SnowflakeIntrospector } from '../introspection/snowflake';
import { type Credentials, DataSourceType, type SnowflakeCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

// Use Snowflake SDK types directly
type SnowflakeError = snowflake.SnowflakeError;

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
      // If no maxRows specified, use regular query
      if (!maxRows || maxRows <= 0) {
        const result = await new Promise<{
          rows: Record<string, unknown>[];
          statement: SnowflakeStatement;
        }>((resolve, reject) => {
          if (!this.connection) {
            reject(new Error('Snowflake connection not initialized'));
            return;
          }
          this.connection.execute({
            sqlText: sql,
            binds: params as snowflake.Binds,
            complete: (
              err: SnowflakeError | undefined,
              stmt: SnowflakeStatement,
              rows: Record<string, unknown>[] | undefined
            ) => {
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
          hasMoreRows: false,
        };
      }

      // Use streaming for SELECT queries with maxRows
      return new Promise((resolve, reject) => {
        if (!this.connection) {
          reject(new Error('Snowflake connection not initialized'));
          return;
        }

        const rows: Record<string, unknown>[] = [];
        let hasMoreRows = false;
        let fields: FieldMetadata[] = [];
        let rowCount = 0;

        const statement = this.connection.execute({
          sqlText: sql,
          binds: params as snowflake.Binds,
          streamResult: true, // Enable streaming
          complete: (err: SnowflakeError | undefined) => {
            if (err) {
              reject(new Error(`Snowflake query failed: ${err.message}`));
              return;
            }

            // Extract field metadata
            fields =
              statement?.getColumns?.()?.map((col) => ({
                name: col.getName(),
                type: col.getType(),
                nullable: col.isNullable(),
                scale: col.getScale() > 0 ? col.getScale() : undefined,
                precision: col.getPrecision() > 0 ? col.getPrecision() : undefined,
              })) || [];

            // Start streaming rows
            const stream = statement.streamRows();

            stream.on('data', (row: Record<string, unknown>) => {
              if (rowCount < maxRows) {
                rows.push(row);
                rowCount++;
              } else if (rowCount === maxRows) {
                hasMoreRows = true;
                // Destroy the stream to stop receiving more data
                stream.destroy();
              }
            });

            stream.on('end', () => {
              resolve({
                rows,
                rowCount: rows.length,
                fields,
                hasMoreRows,
              });
            });

            stream.on('error', (streamErr) => {
              reject(new Error(`Snowflake streaming error: ${streamErr.message}`));
            });

            stream.on('close', () => {
              // Stream closed (either naturally or by destroy())
              if (!stream.destroyed) {
                resolve({
                  rows,
                  rowCount: rows.length,
                  fields,
                  hasMoreRows,
                });
              }
            });
          },
        });
      });
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
          complete: (err: SnowflakeError | undefined) => {
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
        this.connection.destroy((err: SnowflakeError | undefined) => {
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
