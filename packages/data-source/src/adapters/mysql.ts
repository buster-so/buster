import mysql from 'mysql2/promise';
import type { DataSourceIntrospector } from '../introspection/base';
import { MySQLIntrospector } from '../introspection/mysql';
import { type Credentials, DataSourceType, type MySQLCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';
import { normalizeRowValues } from './helpers/normalize-values';
import { mapMySQLType } from './type-mappings/mysql';

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
        database: mysqlCredentials.default_database,
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
            type: mapMySQLType(`mysql_type_${field.type}`), // Map type code to normalized type
            nullable: typeof field.flags === 'number' ? (field.flags & 1) === 0 : true, // NOT_NULL flag is bit 0
            length: typeof field.length === 'number' && field.length > 0 ? field.length : 0,
            precision:
              typeof field.decimals === 'number' && field.decimals > 0 ? field.decimals : 0,
          }))
        : [];

      return {
        rows: resultRows.map(normalizeRowValues),
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

  /**
   * Check if a table exists in MySQL
   */
  async tableExists(database: string, _schema: string, tableName: string): Promise<boolean> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
    }

    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
      `;

      const [rows] = await this.connection.execute(sql, [database, tableName]);
      const firstRow = (rows as Array<{ count?: number }>)[0] as { count?: number } | undefined;
      return !!firstRow && (firstRow.count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  /**
   * Create the Buster logs table in MySQL
   */
  async createLogsTable(
    database: string,
    _schema: string,
    tableName = 'buster_query_logs'
  ): Promise<void> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`${database}\`.\`${tableName}\` (
        message_id VARCHAR(255),
        user_email VARCHAR(500),
        user_name VARCHAR(500),
        chat_id VARCHAR(255),
        chat_link VARCHAR(500),
        request_message TEXT,
        created_at DATETIME,
        duration_seconds INT,
        confidence_score VARCHAR(50),
        assumptions JSON,
        inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.connection.execute(createTableSQL);
      console.info(`Table ${database}.${tableName} created successfully`);
    } catch (error) {
      throw new Error(
        `Failed to create logs table: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Insert a log record into the MySQL table
   */
  override async insertLogRecord(
    database: string,
    _schema: string,
    tableName: string,
    record: {
      messageId: string;
      userEmail: string;
      userName: string;
      chatId: string;
      chatLink: string;
      requestMessage: string;
      createdAt: Date;
      durationSeconds: number;
      confidenceScore: string;
      assumptions: unknown[];
    }
  ): Promise<void> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
    }

    const insertSQL = `
      INSERT INTO \`${database}\`.\`${tableName}\` (
        message_id, 
        user_email, 
        user_name, 
        chat_id,
        chat_link,
        request_message,
        created_at, 
        duration_seconds, 
        confidence_score, 
        assumptions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      record.messageId,
      record.userEmail,
      record.userName,
      record.chatId,
      record.chatLink,
      record.requestMessage,
      record.createdAt,
      record.durationSeconds,
      record.confidenceScore,
      JSON.stringify(record.assumptions),
    ];

    try {
      await this.connection.execute(insertSQL, params);
      console.info(`Log record inserted for message ${record.messageId}`);
    } catch (error) {
      throw new Error(
        `Failed to insert log record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute a write operation (INSERT, UPDATE, DELETE)
   */
  override async executeWrite(
    sql: string,
    params?: QueryParameter[],
    timeout?: number
  ): Promise<{ rowCount: number }> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MySQL connection not initialized');
    }

    try {
      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;

      const queryPromise = this.connection.execute(sql, params);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query execution timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const [result] = await Promise.race([queryPromise, timeoutPromise]);

      // For write operations, MySQL returns a ResultSetHeader
      if (result && typeof result === 'object' && 'affectedRows' in result) {
        const resultSet = result as mysql.ResultSetHeader;
        return {
          rowCount: resultSet.affectedRows || 0,
        };
      }

      return {
        rowCount: 0,
      };
    } catch (error) {
      throw new Error(
        `MySQL write operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
