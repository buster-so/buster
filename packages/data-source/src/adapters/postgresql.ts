import { Client, type ClientConfig } from 'pg';
import Cursor from 'pg-cursor';
import type { DataSourceIntrospector } from '../introspection/base';
import { PostgreSQLIntrospector } from '../introspection/postgresql';
import { type Credentials, DataSourceType, type PostgreSQLCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';
import { normalizeRowValues } from './helpers/normalize-values';
import { mapPostgreSQLType } from './type-mappings/postgresql';

// Internal types for pg-cursor that aren't exported
interface CursorResult {
  fields: Array<{
    name: string;
    dataTypeID: number;
    dataTypeSize: number;
  }>;
}

interface CursorWithResult extends Cursor {
  _result?: CursorResult;
}

/**
 * PostgreSQL database adapter
 */
export class PostgreSQLAdapter extends BaseAdapter {
  private client?: Client | undefined;
  private introspector?: PostgreSQLIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.PostgreSQL);
    const pgCredentials = credentials as PostgreSQLCredentials;

    try {
      // Handle both 'database' and 'default_database' for backward compatibility
      const database = pgCredentials.database || pgCredentials.default_database;

      if (!database) {
        throw new Error(
          'Database name is required. Please provide either "database" or "default_database" in credentials.'
        );
      }

      const config: ClientConfig = {
        host: pgCredentials.host,
        port: pgCredentials.port || 5432,
        database: database,
        user: pgCredentials.username,
        password: pgCredentials.password,
      };

      // Handle SSL configuration - default to true for security
      // But allow self-signed certificates to avoid connection errors
      if (pgCredentials.ssl !== false) {
        config.ssl =
          pgCredentials.ssl === true || pgCredentials.ssl === undefined
            ? { rejectUnauthorized: false } // Allow self-signed certificates
            : pgCredentials.ssl; // Use custom SSL config if provided
      }

      // Handle connection timeout
      if (pgCredentials.connection_timeout) {
        config.connectionTimeoutMillis = pgCredentials.connection_timeout;
      }

      // Set default schema if provided
      if (pgCredentials.schema) {
        config.options = `-c search_path=${pgCredentials.schema}`;
      }

      this.client = new Client(config);
      await this.client.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize PostgreSQL client: ${error instanceof Error ? error.message : 'Unknown error'}`
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

    if (!this.client) {
      throw new Error('PostgreSQL client not initialized');
    }

    try {
      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;
      await this.client.query(`SET statement_timeout = ${timeoutMs}`);

      // If no maxRows specified, use regular query
      if (!maxRows || maxRows <= 0) {
        const result = await this.client.query(sql, params);

        const fields: FieldMetadata[] =
          result.fields?.map((field) => ({
            name: field.name,
            type: mapPostgreSQLType(`pg_type_${field.dataTypeID}`), // Map OID to normalized type
            nullable: true, // PostgreSQL doesn't provide this info directly
            length: field.dataTypeSize > 0 ? field.dataTypeSize : 0,
          })) || [];

        return {
          rows: result.rows.map(normalizeRowValues),
          rowCount: result.rowCount || result.rows.length,
          fields,
          hasMoreRows: false,
        };
      }

      // Use cursor for SELECT queries with maxRows
      const cursor = this.client.query(new Cursor(sql, params)) as CursorWithResult;
      const rows: Record<string, unknown>[] = [];
      let hasMoreRows = false;
      let fields: FieldMetadata[] = [];

      // Read rows in batches
      const batchSize = Math.min(maxRows, 1000); // Read up to 1000 rows at a time
      let totalRead = 0;

      while (totalRead < maxRows) {
        const remainingRows = maxRows - totalRead;
        const readSize = Math.min(batchSize, remainingRows) + 1; // Read one extra to check for more

        const batchRows = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
          cursor.read(readSize, (err, batchRows) => {
            if (err) {
              reject(err);
            } else {
              resolve(batchRows);
            }
          });
        });

        if (batchRows.length === 0) {
          break; // No more rows
        }

        // Extract field metadata from cursor on first batch
        if (fields.length === 0 && cursor._result?.fields) {
          fields = cursor._result.fields.map((field) => ({
            name: field.name,
            type: mapPostgreSQLType(`pg_type_${field.dataTypeID}`), // Map OID to normalized type
            nullable: true,
            length: field.dataTypeSize > 0 ? field.dataTypeSize : 0,
          }));
        }

        // Check if we have more rows than requested
        if (totalRead + batchRows.length > maxRows) {
          hasMoreRows = true;
          rows.push(...batchRows.slice(0, maxRows - totalRead).map(normalizeRowValues));
          break;
        }

        rows.push(...batchRows.map(normalizeRowValues));
        totalRead += batchRows.length;

        // If we got fewer rows than requested, we've reached the end
        if (batchRows.length < readSize) {
          break;
        }
      }

      // Close the cursor
      await new Promise<void>((resolve, reject) => {
        cursor.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      return {
        rows,
        rowCount: rows.length,
        fields,
        hasMoreRows,
      };
    } catch (error) {
      throw new Error(
        `PostgreSQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test connection by running a simple query
      await this.client.query('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
      } catch (error) {
        // Log error but don't throw - connection is being closed anyway
        console.error('Error closing PostgreSQL connection:', error);
      }
      this.client = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.PostgreSQL;
  }

  introspect(): DataSourceIntrospector {
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new PostgreSQLIntrospector('postgresql', this);
    }
    return this.introspector;
  }

  /**
   * Insert a log record into the PostgreSQL table
   */
  override async insertLogRecord(
    _database: string,
    schema: string,
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

    if (!this.client) {
      throw new Error('PostgreSQL client not initialized');
    }

    const insertSQL = `
      INSERT INTO "${schema}"."${tableName}" (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      await this.client.query(insertSQL, params);
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

    if (!this.client) {
      throw new Error('PostgreSQL client not initialized');
    }

    try {
      // Set query timeout if specified (default: 60 seconds)
      const timeoutMs = timeout || 60000;
      await this.client.query(`SET statement_timeout = ${timeoutMs}`);

      const result = await this.client.query(sql, params);

      return {
        rowCount: result.rowCount ?? 0,
      };
    } catch (error) {
      throw new Error(
        `PostgreSQL write operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
