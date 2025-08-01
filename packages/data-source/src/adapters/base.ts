import type { CancellableQuery } from '../cancellation/index.js';
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
   * Create a cancellable query instance
   */
  createCancellableQuery(
    sql: string,
    params?: QueryParameter[]
  ): CancellableQuery<AdapterQueryResult>;

  /**
   * Cancel a query by ID (if supported)
   */
  cancelQuery(queryId: string): Promise<void>;

  /**
   * Check if this adapter supports query cancellation
   */
  isQueryCancellable(): boolean;
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
  abstract createCancellableQuery(
    sql: string,
    params?: QueryParameter[]
  ): CancellableQuery<AdapterQueryResult>;
  abstract cancelQuery(queryId: string): Promise<void>;
  abstract isQueryCancellable(): boolean;

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
