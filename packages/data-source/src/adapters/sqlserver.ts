import sql from 'mssql';
import type { DataSourceIntrospector } from '../introspection/base';
import { SQLServerIntrospector } from '../introspection/sqlserver';
import { type Credentials, DataSourceType, type SQLServerCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

// Internal types for mssql column metadata that aren't properly exported
interface ColumnMetadata {
  type?: (() => { name?: string }) | { name?: string };
  length?: number;
  nullable?: boolean;
}

/**
 * SQL Server database adapter
 */
export class SQLServerAdapter extends BaseAdapter {
  private pool?: sql.ConnectionPool | undefined;
  private introspector?: SQLServerIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.SQLServer);
    const sqlServerCredentials = credentials as SQLServerCredentials;

    try {
      const config: sql.config = {
        server: sqlServerCredentials.server,
        port: sqlServerCredentials.port,
        database: sqlServerCredentials.default_database,
        user: sqlServerCredentials.username,
        password: sqlServerCredentials.password,
        options: {
          encrypt: sqlServerCredentials.encrypt ?? true,
          trustServerCertificate: sqlServerCredentials.trust_server_certificate ?? false,
        },
      };

      // Handle domain authentication
      if (sqlServerCredentials.domain) {
        config.domain = sqlServerCredentials.domain;
      }

      // Handle instance name
      if (sqlServerCredentials.instance) {
        if (!config.options) {
          config.options = {};
        }
        config.options.instanceName = sqlServerCredentials.instance;
      }

      // Handle timeouts
      if (sqlServerCredentials.connection_timeout) {
        config.connectionTimeout = sqlServerCredentials.connection_timeout;
      }

      if (sqlServerCredentials.request_timeout) {
        config.requestTimeout = sqlServerCredentials.request_timeout;
      }

      this.pool = new sql.ConnectionPool(config);
      await this.pool.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize SQL Server client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(
    sqlQuery: string,
    params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.pool) {
      throw new Error('SQL Server connection pool not initialized');
    }

    try {
      const request = this.pool.request();

      // Helper function to add timeout to any query promise
      const executeWithTimeout = async <T>(
        queryPromise: Promise<T>,
        timeoutMs: number
      ): Promise<T> => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`SQL Server query execution timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        });

        return Promise.race([queryPromise, timeoutPromise]);
      };

      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;
      let processedQuery = sqlQuery;

      // Add parameters if provided
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });

        // Replace ? placeholders with @param0, @param1, etc.
        let paramIndex = 0;
        processedQuery = processedQuery.replace(/\?/g, () => `@param${paramIndex++}`);
      }

      // If no maxRows specified, use regular query
      if (!maxRows || maxRows <= 0) {
        const result = await executeWithTimeout(request.query(processedQuery), timeoutMs);

        const fields: FieldMetadata[] = result.recordset?.columns
          ? Object.keys(result.recordset.columns).map((name) => {
              const column = result.recordset?.columns?.[name];
              const columnType = typeof column?.type === 'function' ? column.type() : column?.type;

              // Type the column type properly instead of using unknown
              const typedColumnType = columnType as { name?: string } | undefined;

              return {
                name,
                type: typedColumnType?.name || 'unknown',
                length: column?.length ?? 0,
                nullable: column?.nullable ?? true,
              };
            })
          : [];

        return {
          rows: result.recordset || [],
          rowCount: result.recordset?.length || 0,
          fields,
          hasMoreRows: false,
        };
      }

      // Use streaming for SELECT queries with maxRows
      const streamingPromise = new Promise<AdapterQueryResult>((resolve, reject) => {
        const rows: Record<string, unknown>[] = [];
        let hasMoreRows = false;
        let fields: FieldMetadata[] = [];
        let rowCount = 0;

        // Enable streaming mode
        request.stream = true;

        // Listen for column metadata
        request.on('recordset', (columns: Record<string, ColumnMetadata>) => {
          fields = Object.keys(columns).map((name) => {
            const column = columns[name];
            const columnType = typeof column?.type === 'function' ? column.type() : column?.type;
            const typedColumnType = columnType as { name?: string } | undefined;

            return {
              name,
              type: typedColumnType?.name || 'unknown',
              length: column?.length ?? 0,
              nullable: column?.nullable ?? true,
            };
          });
        });

        // Listen for each row
        request.on('row', (row: Record<string, unknown>) => {
          if (rowCount < maxRows) {
            rows.push(row);
            rowCount++;
          } else if (rowCount === maxRows) {
            hasMoreRows = true;
            // Pause the stream to stop receiving more rows
            request.pause();
            // Cancel the request to stop processing
            request.cancel();
          }
        });

        // Listen for errors
        request.on('error', (err) => {
          reject(new Error(`SQL Server query failed: ${err.message}`));
        });

        // Listen for completion
        request.on('done', () => {
          resolve({
            rows,
            rowCount: rows.length,
            fields,
            hasMoreRows,
          });
        });

        // Execute the query
        request.query(processedQuery);
      });

      return await executeWithTimeout(streamingPromise, timeoutMs);
    } catch (error) {
      throw new Error(
        `SQL Server query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      // Test connection by running a simple query
      const request = this.pool.request();
      await request.query('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
      } catch (error) {
        // Log error but don't throw - connection is being closed anyway
        console.error('Error closing SQL Server connection:', error);
      }
      this.pool = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.SQLServer;
  }

  introspect(): DataSourceIntrospector {
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new SQLServerIntrospector('sqlserver', this);
    }
    return this.introspector;
  }
}
