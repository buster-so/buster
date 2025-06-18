import snowflake from 'snowflake-sdk';
import {
  ConnectionPoolError,
  QueryTimeoutError,
  classifyError,
} from '../errors/data-source-errors';
import type { DataSourceIntrospector } from '../introspection/base';
import { SnowflakeIntrospector } from '../introspection/snowflake';
import { type Credentials, DataSourceType, type SnowflakeCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';
import { SnowflakeConnectionPool } from './snowflake-pool';

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

// Global connection pool map - one pool per unique credential set
const connectionPools = new Map<string, SnowflakeConnectionPool>();

/**
 * Snowflake database adapter with connection pooling
 */
export class SnowflakeAdapter extends BaseAdapter {
  private pool?: SnowflakeConnectionPool;
  private poolKey?: string;
  private introspector?: SnowflakeIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Snowflake);
    const snowflakeCredentials = credentials as SnowflakeCredentials;

    try {
      // Create a unique key for this credential set
      this.poolKey = `${snowflakeCredentials.account_id}-${snowflakeCredentials.username}-${snowflakeCredentials.warehouse_id}-${snowflakeCredentials.default_database}`;

      // Check if a pool already exists for these credentials
      if (!connectionPools.has(this.poolKey)) {
        const pool = new SnowflakeConnectionPool(snowflakeCredentials, {
          minConnections: 5,
          maxConnections: 25, // Increased to support 50 concurrent queries
          idleTimeout: 300000, // 5 minutes
          acquireTimeout: 45000, // 45 seconds (increased for higher load)
          connectionTimeout: 60000, // 60 seconds
        });

        await pool.initialize();
        connectionPools.set(this.poolKey, pool);
      }

      this.pool = connectionPools.get(this.poolKey);
      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw classifyError(error);
    }
  }

  async query(
    sql: string,
    params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.pool) {
      throw new Error('Snowflake connection pool not initialized');
    }

    // Helper function to add timeout to any query promise
    const executeWithTimeout = async <T>(
      queryPromise: Promise<T>,
      timeoutMs: number
    ): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new QueryTimeoutError(timeoutMs, sql));
        }, timeoutMs);
      });

      return Promise.race([queryPromise, timeoutPromise]);
    };

    // Acquire a connection from the pool
    let connection: snowflake.Connection | null = null;

    try {
      connection = await this.pool.acquire();

      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;

      // If no maxRows specified, use regular query
      if (!maxRows || maxRows <= 0) {
        const queryPromise = new Promise<{
          rows: Record<string, unknown>[];
          statement: SnowflakeStatement;
        }>((resolve, reject) => {
          if (!connection) {
            reject(new Error('Failed to acquire Snowflake connection'));
            return;
          }
          connection.execute({
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

        const result = await executeWithTimeout(queryPromise, timeoutMs);

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
      const streamingPromise = new Promise<AdapterQueryResult>((resolve, reject) => {
        if (!connection) {
          reject(new Error('Failed to acquire Snowflake connection'));
          return;
        }

        const rows: Record<string, unknown>[] = [];
        let hasMoreRows = false;
        let fields: FieldMetadata[] = [];
        let rowCount = 0;

        const statement = connection.execute({
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

      return await executeWithTimeout(streamingPromise, timeoutMs);
    } catch (error) {
      // Use the error classification system
      throw classifyError(error, { sql, timeout: timeout || 60000 });
    } finally {
      // Always release the connection back to the pool
      if (connection && this.pool) {
        this.pool.release(connection);
      }
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    let connection: snowflake.Connection | null = null;

    try {
      // Acquire a connection with a shorter timeout for testing
      connection = await this.pool.acquire();

      // Test connection by running a simple query
      await new Promise<void>((resolve, reject) => {
        if (!connection) {
          reject(new Error('Failed to acquire connection for test'));
          return;
        }
        connection.execute({
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
    } finally {
      // Release the connection back to the pool
      if (connection && this.pool) {
        this.pool.release(connection);
      }
    }
  }

  async close(): Promise<void> {
    // We don't close the shared connection pool here
    // Just mark this adapter as disconnected
    this.connected = false;
    this.pool = undefined;
    this.poolKey = undefined;
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

  /**
   * Get connection pool statistics for monitoring
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }
    return this.pool.getStats();
  }

  /**
   * Static method to close all connection pools
   * Should be called on application shutdown
   */
  static async closeAllPools(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const pool of connectionPools.values()) {
      promises.push(pool.close());
    }
    await Promise.all(promises);
    connectionPools.clear();
  }

  /**
   * Static method to get statistics for all pools
   */
  static getAllPoolStats() {
    const stats: Record<string, unknown> = {};
    for (const [key, pool] of connectionPools.entries()) {
      stats[key] = pool.getStats();
    }
    return stats;
  }
}
