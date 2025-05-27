import mysql from 'mysql2/promise';
import { type Credentials, DataSourceType, type MySQLCredentials } from '../types/credentials';
import { type AdapterQueryResult, BaseAdapter } from './base';

/**
 * MySQL database adapter
 */
export class MySQLAdapter extends BaseAdapter {
  private connection?: mysql.Connection;

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

  async query(sql: string, params?: any[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
    }

    try {
      const [rows, fields] = await this.connection.execute(sql, params);

      // Handle different result types
      let resultRows: any[] = [];
      let rowCount = 0;

      if (Array.isArray(rows)) {
        resultRows = rows;
        rowCount = rows.length;
      } else if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
        // For INSERT, UPDATE, DELETE operations
        rowCount = (rows as any).affectedRows || 0;
        resultRows = [];
      }

      return {
        rows: resultRows,
        rowCount,
        fields: Array.isArray(fields)
          ? fields.map((field) => ({
              name: field.name,
              type: field.type,
              length: field.length,
              flags: field.flags,
              decimals: field.decimals,
            }))
          : [],
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
}
