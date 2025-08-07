import mysql from 'mysql2/promise';
import { BaseCancellationController, type CancellableQuery } from '../cancellation/index.js';
import { QueryCancellationError } from '../errors/data-source-errors';
import type { DataSourceIntrospector } from '../introspection/base';
import { MySQLIntrospector } from '../introspection/mysql';
import { type Credentials, DataSourceType, type MySQLCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

class MySQLCancellableQuery implements CancellableQuery<AdapterQueryResult> {
  private cancelled = false;
  private controller = new BaseCancellationController();
  private connection?: mysql.Connection;

  constructor(
    private createConnection: () => Promise<mysql.Connection>,
    private sql: string,
    private params?: QueryParameter[],
    private maxRows?: number,
    private timeout?: number
  ) {}

  async execute(): Promise<AdapterQueryResult> {
    if (this.cancelled) {
      throw new QueryCancellationError(this.sql);
    }

    this.connection = await this.createConnection();

    this.controller.onCancellation(async () => {
      if (this.connection) {
        try {
          await this.connection.end();
        } catch (error) {
          console.warn('MySQL connection termination warning:', error);
        }
      }
    });

    const timeoutMs = this.timeout || 60000;

    const queryPromise = this.connection.execute(this.sql, this.params);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const [rows, fields] = await Promise.race([queryPromise, timeoutPromise]);

    if (this.cancelled) {
      throw new QueryCancellationError(this.sql);
    }

    let resultRows: Record<string, unknown>[] = [];
    let rowCount = 0;
    let hasMoreRows = false;

    if (Array.isArray(rows)) {
      if (this.maxRows && this.maxRows > 0 && rows.length > this.maxRows) {
        hasMoreRows = true;
        resultRows = rows.slice(0, this.maxRows) as Record<string, unknown>[];
      } else {
        resultRows = rows as Record<string, unknown>[];
      }
      rowCount = resultRows.length;
    } else if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
      const resultSet = rows as mysql.ResultSetHeader;
      rowCount = resultSet.affectedRows || 0;
      resultRows = [];
    }

    const fieldMetadata: FieldMetadata[] = Array.isArray(fields)
      ? fields.map((field) => ({
          name: field.name,
          type: `mysql_type_${field.type}`,
          nullable: typeof field.flags === 'number' ? (field.flags & 1) === 0 : true,
          length: typeof field.length === 'number' && field.length > 0 ? field.length : 0,
          precision: typeof field.decimals === 'number' && field.decimals > 0 ? field.decimals : 0,
        }))
      : [];

    return {
      rows: resultRows,
      rowCount,
      fields: fieldMetadata,
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
 * MySQL database adapter
 */
export class MySQLAdapter extends BaseAdapter {
  private connection?: mysql.Connection | undefined;
  private introspector?: MySQLIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.MySQL);
    const mysqlCredentials = credentials as MySQLCredentials;

    try {
      const config: mysql.ConnectionOptions = {
        host: mysqlCredentials.host,
        port: mysqlCredentials.port || 3306,
        database: mysqlCredentials.database,
        user: mysqlCredentials.username,
        password: mysqlCredentials.password,
      };

      // Handle SSL configuration
      if (mysqlCredentials.ssl !== undefined && typeof mysqlCredentials.ssl === 'object') {
        // For object SSL configuration, mysql2 expects specific properties
        config.ssl = {
          rejectUnauthorized: mysqlCredentials.ssl.rejectUnauthorized ?? true,
          ...(mysqlCredentials.ssl.ca && { ca: mysqlCredentials.ssl.ca }),
          ...(mysqlCredentials.ssl.cert && { cert: mysqlCredentials.ssl.cert }),
          ...(mysqlCredentials.ssl.key && { key: mysqlCredentials.ssl.key }),
        };
      }

      // Handle connection timeout
      if (mysqlCredentials.connection_timeout) {
        config.connectTimeout = mysqlCredentials.connection_timeout;
      }

      // Handle charset
      if (mysqlCredentials.charset) {
        config.charset = mysqlCredentials.charset;
      }

      this.connection = await mysql.createConnection(config);

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize MySQL client: ${error instanceof Error ? error.message : 'Unknown error'}`
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

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
    }

    try {
      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;

      // For MySQL, use Promise.race() to implement timeout since mysql2
      // doesn't support per-query timeouts on existing connections
      const queryPromise = this.connection.execute(sql, params);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query execution timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // MySQL2 with promise connections doesn't support true streaming.
      // We execute the full query and limit results in memory.
      // This means the database still processes the full result set,
      // but we protect the application memory by only keeping maxRows.
      // For true streaming support, you would need to use the callback-based API.
      const [rows, fields] = await Promise.race([queryPromise, timeoutPromise]);

      // Handle different result types
      let resultRows: Record<string, unknown>[] = [];
      let rowCount = 0;
      let hasMoreRows = false;

      if (Array.isArray(rows)) {
        // For SELECT queries that return rows
        if (maxRows && maxRows > 0 && rows.length > maxRows) {
          // We have more rows than requested - limit them in memory
          hasMoreRows = true;
          resultRows = rows.slice(0, maxRows) as Record<string, unknown>[];
        } else {
          resultRows = rows as Record<string, unknown>[];
        }
        rowCount = resultRows.length;
      } else if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
        // For INSERT, UPDATE, DELETE operations
        const resultSet = rows as mysql.ResultSetHeader;
        rowCount = resultSet.affectedRows || 0;
        resultRows = [];
      }

      const fieldMetadata: FieldMetadata[] = Array.isArray(fields)
        ? fields.map((field) => ({
            name: field.name,
            type: `mysql_type_${field.type}`, // MySQL field type
            nullable: typeof field.flags === 'number' ? (field.flags & 1) === 0 : true, // NOT_NULL flag is bit 0
            length: typeof field.length === 'number' && field.length > 0 ? field.length : 0,
            precision:
              typeof field.decimals === 'number' && field.decimals > 0 ? field.decimals : 0,
          }))
        : [];

      return {
        rows: resultRows,
        rowCount,
        fields: fieldMetadata,
        hasMoreRows,
      };
    } catch (error) {
      throw new Error(
        `MySQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }

      // Test connection by running a simple query
      await this.connection.execute('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.end();
      } catch (error) {
        // Log error but don't throw - connection is being closed anyway
        console.error('Error closing MySQL connection:', error);
      }
      this.connection = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.MySQL;
  }

  introspect(): DataSourceIntrospector {
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new MySQLIntrospector('mysql', this);
    }
    return this.introspector;
  }

  createCancellableQuery(
    sql: string,
    params?: QueryParameter[]
  ): CancellableQuery<AdapterQueryResult> {
    this.ensureConnected();

    const createConnection = async () => {
      const credentials = this.credentials as MySQLCredentials;
      const config: mysql.ConnectionOptions = {
        host: credentials.host,
        port: credentials.port || 3306,
        database: credentials.database,
        user: credentials.username,
        password: credentials.password,
      };

      if (credentials.ssl !== undefined && typeof credentials.ssl === 'object') {
        config.ssl = {
          rejectUnauthorized: credentials.ssl.rejectUnauthorized ?? true,
          ...(credentials.ssl.ca && { ca: credentials.ssl.ca }),
          ...(credentials.ssl.cert && { cert: credentials.ssl.cert }),
          ...(credentials.ssl.key && { key: credentials.ssl.key }),
        };
      }

      if (credentials.connection_timeout) {
        config.connectTimeout = credentials.connection_timeout;
      }

      if (credentials.charset) {
        config.charset = credentials.charset;
      }

      return mysql.createConnection(config);
    };

    return new MySQLCancellableQuery(createConnection, sql, params);
  }

  async cancelQuery(_queryId: string): Promise<void> {
    console.warn('MySQL cancelQuery by ID not implemented - use CancellableQuery instead');
  }

  isQueryCancellable(): boolean {
    return true;
  }
}
