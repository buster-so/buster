import { Client, type ClientConfig } from 'pg';
import Cursor from 'pg-cursor';
import type { DataSourceIntrospector } from '../introspection/base';
import { RedshiftIntrospector } from '../introspection/redshift';
import { type Credentials, DataSourceType, type RedshiftCredentials } from '../types/credentials';
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
 * Redshift database adapter (PostgreSQL-compatible)
 */
export class RedshiftAdapter extends BaseAdapter {
  private client?: Client | undefined;
  private introspector?: RedshiftIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Redshift);
    const redshiftCredentials = credentials as RedshiftCredentials;

    try {
      // Handle both 'database' and 'default_database' for backward compatibility
      const database = redshiftCredentials.default_database;

      if (!database) {
        throw new Error(
          'Database name is required. Please provide either "database" or "default_database" in credentials.'
        );
      }

      const config: ClientConfig = {
        host: redshiftCredentials.host,
        port: redshiftCredentials.port || 5439, // Default Redshift port
        database: database,
        user: redshiftCredentials.username,
        password: redshiftCredentials.password,
        ssl: redshiftCredentials.ssl ?? true, // SSL is typically required for Redshift
      };

      // Handle connection timeout - default to 60 seconds for serverless
      config.connectionTimeoutMillis = redshiftCredentials.connection_timeout || 60000;

      // Set default schema if provided (handle both 'schema' and 'default_schema')
      const schema = redshiftCredentials.default_schema;
      if (schema) {
        config.options = `-c search_path=${schema}`;
      }

      this.client = new Client(config);
      await this.client.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Redshift client: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      throw new Error('Redshift client not initialized');
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
            type: mapPostgreSQLType(`pg_type_${field.dataTypeID}`), // Map OID to normalized type (Redshift uses PostgreSQL OIDs)
            nullable: true, // Redshift doesn't provide this info directly
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
            type: mapPostgreSQLType(`pg_type_${field.dataTypeID}`), // Map OID to normalized type (Redshift uses PostgreSQL OIDs)
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
        `Redshift query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        console.error('Error closing Redshift connection:', error);
      }
      this.client = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.Redshift;
  }

  introspect(): DataSourceIntrospector {
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new RedshiftIntrospector('redshift', this);
    }
    return this.introspector;
  }

  /**
   * Check if a table exists in Redshift
   */
  async tableExists(database: string, schema: string, tableName: string): Promise<boolean> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Redshift client not initialized');
    }

    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_catalog = $1
        AND table_schema = $2
        AND table_name = $3
      `;

      const result = await this.client.query(sql, [
        database,
        schema.toLowerCase(),
        tableName.toLowerCase(),
      ]);
      const firstRow = result.rows[0] as { count?: string } | undefined;
      return !!firstRow && Number.parseInt(firstRow.count ?? '0') > 0;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  /**
   * Create the Buster logs table in Redshift
   */
  async createLogsTable(
    _database: string,
    schema: string,
    tableName = 'buster_query_logs'
  ): Promise<void> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Redshift client not initialized');
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "${schema}"."${tableName}" (
        message_id VARCHAR(255),
        user_email VARCHAR(500),
        user_name VARCHAR(500),
        chat_id VARCHAR(255),
        chat_link VARCHAR(500),
        request_message VARCHAR(MAX),
        created_at TIMESTAMPTZ,
        duration_seconds INTEGER,
        confidence_score VARCHAR(50),
        assumptions SUPER,
        inserted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.client.query(createTableSQL);
      console.info(`Table ${schema}.${tableName} created successfully`);
    } catch (error) {
      throw new Error(
        `Failed to create logs table: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Insert a log record into the Redshift table
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
      throw new Error('Redshift client not initialized');
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, JSON_PARSE($10))
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
      throw new Error('Redshift client not initialized');
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
        `Redshift write operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
