import mysql from 'mysql2/promise';
import type { DataSourceIntrospector } from '../introspection/base';
import { MySQLIntrospector } from '../introspection/mysql';
import { type Credentials, DataSourceType, type MySQLCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

/**
 * MySQL database adapter
 */
export class MySQLAdapter extends BaseAdapter {
  private connection?: mysql.Connection;
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
          ca: mysqlCredentials.ssl.ca,
          cert: mysqlCredentials.ssl.cert,
          key: mysqlCredentials.ssl.key,
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
    maxRows?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
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

      const [rows, fields] = await this.connection.execute(limitedSql, params);

      // Handle different result types
      let resultRows: Record<string, unknown>[] = [];
      let rowCount = 0;

      if (Array.isArray(rows)) {
        resultRows = rows as Record<string, unknown>[];

        // Check if we have more rows than requested
        if (maxRows && resultRows.length > maxRows) {
          hasMoreRows = true;
          // Remove the extra row we fetched to check for more
          resultRows = resultRows.slice(0, maxRows);
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
            length: typeof field.length === 'number' && field.length > 0 ? field.length : undefined,
            precision:
              typeof field.decimals === 'number' && field.decimals > 0 ? field.decimals : undefined,
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
      await this.connection.end();
      this.connection = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.MySQL;
  }

  introspect(): DataSourceIntrospector {
    if (!this.introspector) {
      this.introspector = new MySQLIntrospector('mysql', this);
    }
    return this.introspector;
  }
}
