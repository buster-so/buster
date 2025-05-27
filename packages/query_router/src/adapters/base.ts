import type { Credentials } from '../types/credentials';

/**
 * Simplified query result for adapters
 */
export interface AdapterQueryResult {
  /** Result rows */
  rows: any[];

  /** Number of rows returned or affected */
  rowCount: number;

  /** Field/column metadata */
  fields: any[];
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
  query(sql: string, params?: any[]): Promise<AdapterQueryResult>;

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
}

/**
 * Base adapter class with common functionality
 */
export abstract class BaseAdapter implements DatabaseAdapter {
  protected credentials?: Credentials;
  protected connected = false;

  abstract initialize(credentials: Credentials): Promise<void>;
  abstract query(sql: string, params?: any[]): Promise<AdapterQueryResult>;
  abstract testConnection(): Promise<boolean>;
  abstract close(): Promise<void>;
  abstract getDataSourceType(): string;

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
