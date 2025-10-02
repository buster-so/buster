import type { DataSourceIntrospector } from '../introspection/base';
import type { Credentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';

/**
 * Field/column metadata for query results
 */
export interface FieldMetadata {
  /** Field name */
  name: string;
  /** Field data type */
  type: string;
  /** Whether field allows null values */
  nullable?: boolean;
  /** Field length (for string types) */
  length?: number;
  /** Field precision (for numeric types) */
  precision?: number;
  /** Field scale (for numeric types) */
  scale?: number;
}

/**
 * Simplified query result for adapters
 */
export interface AdapterQueryResult {
  /** Result rows */
  rows: Record<string, unknown>[];

  /** Number of rows returned or affected */
  rowCount: number;

  /** Field/column metadata */
  fields: FieldMetadata[];

  /** Total row count before limiting (if available) */
  totalRowCount?: number;

  /** Whether the results were limited */
  hasMoreRows?: boolean;
}

/**
 * Base interface that all database adapters must implement
 */
export interface DatabaseAdapter {
  /**
   * Initialize the adapter with credentials
   */
  initialize(credentials: Credentials): Promise<void>;

  /**
   * Execute a SQL query
   */
  query(
    sql: string,
    params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult>;

  /**
   * Test the connection to the database
   */
  testConnection(): Promise<boolean>;

  /**
   * Close the connection to the database
   */
  close(): Promise<void>;

  /**
   * Get the data source type this adapter handles
   */
  getDataSourceType(): string;

  /**
   * Get an introspector instance for this adapter
   */
  introspect(): DataSourceIntrospector;

  /**
   * Optional: Insert a log record into the table (for writeback functionality)
   */
  insertLogRecord?(
    database: string,
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
  ): Promise<void>;

  /**
   * Optional: Execute a write operation (INSERT, UPDATE, DELETE)
   */
  executeWrite?(
    sql: string,
    params?: QueryParameter[],
    timeout?: number
  ): Promise<{ rowCount: number }>;
}

/**
 * Base adapter class with common functionality
 */
export abstract class BaseAdapter implements DatabaseAdapter {
  protected credentials?: Credentials;
  protected connected = false;

  abstract initialize(credentials: Credentials): Promise<void>;
  abstract query(
    sql: string,
    params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult>;
  abstract testConnection(): Promise<boolean>;
  abstract close(): Promise<void>;
  abstract getDataSourceType(): string;
  abstract introspect(): DataSourceIntrospector;

  /**
   * Optional: Insert a log record into the table (for writeback functionality)
   */
  async insertLogRecord?(
    _database: string,
    _schema: string,
    _tableName: string,
    _record: {
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
    throw new Error('Logs writeback not implemented for this adapter');
  }

  /**
   * Optional: Execute a write operation (INSERT, UPDATE, DELETE)
   */
  async executeWrite?(
    _sql: string,
    _params?: QueryParameter[],
    _timeout?: number
  ): Promise<{ rowCount: number }> {
    throw new Error('Write operations not implemented for this adapter');
  }

  /**
   * Check if the adapter is connected
   */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new Error(
        `${this.getDataSourceType()} adapter is not connected. Call initialize() first.`
      );
    }
  }

  /**
   * Validate that credentials match the expected type
   */
  protected validateCredentials(credentials: Credentials, expectedType: string): void {
    if (credentials.type !== expectedType) {
      throw new Error(
        `Invalid credentials type. Expected ${expectedType}, got ${credentials.type}`
      );
    }
  }
}
