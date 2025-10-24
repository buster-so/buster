/**
 * MotherDuck database adapter (cloud-native DuckDB)
 * Uses @duckdb/node-api for Node.js integration
 */

import { TIMEOUT_CONFIG } from '../config/timeouts';
import { classifyError, QueryTimeoutError } from '../errors/data-source-errors';
import type { DataSourceIntrospector } from '../introspection/base';
import { MotherDuckIntrospector } from '../introspection/motherduck';
import { type Credentials, DataSourceType, type MotherDuckCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';
import { normalizeRowValues } from './helpers/normalize-values';
import { mapDuckDBType } from './type-mappings/duckdb';

/**
 * Type definitions for @duckdb/node-api
 * These are simplified types based on the Node Neo API
 */
interface DuckDBInstance {
  connect(): Promise<DuckDBConnection>;
  close?(): Promise<void>; // close may not be implemented
}

interface DuckDBConnection {
  run(sql: string): Promise<DuckDBResult>;
  close?(): Promise<void>; // close may not be implemented
}

interface DuckDBResult {
  rowCount: number;
  columnNames(): string[];
  columnTypes(): Array<{ alias: string; name: string }>;
  getRowObjects(): Promise<Record<string, unknown>[]>;
}

/**
 * MotherDuck database adapter implementation
 * Connects to MotherDuck cloud databases using the DuckDB Node Neo client
 */
export class MotherDuckAdapter extends BaseAdapter {
  private database?: DuckDBInstance;
  private connection?: DuckDBConnection;
  private introspector?: MotherDuckIntrospector;

  /**
   * Initialize the MotherDuck adapter with credentials
   * Builds connection string and establishes connection
   */
  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.MotherDuck);
    const mdCredentials = credentials as MotherDuckCredentials;

    try {
      // Build MotherDuck connection string
      const connectionString = this.buildConnectionString(mdCredentials);

      // Import DuckDB dynamically (to avoid bundling issues)
      const { DuckDBInstance } = await import('@duckdb/node-api');

      // Create DuckDB instance with MotherDuck connection string
      const db = await DuckDBInstance.create(connectionString);
      this.database = db as unknown as DuckDBInstance;

      // Create connection
      this.connection = (await db.connect()) as unknown as DuckDBConnection;

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw classifyError(error);
    }
  }

  /**
   * Build MotherDuck connection string from credentials
   * Format: md:database_name?motherduck_token=<token>&param=value
   */
  private buildConnectionString(credentials: MotherDuckCredentials): string {
    // Get token from credentials or environment variable
    const token = credentials.token || process.env.motherduck_token;

    if (!token) {
      throw new Error(
        'MotherDuck token is required. Provide via credentials.token or motherduck_token environment variable.'
      );
    }

    // Build base connection string
    const database = credentials.default_database;
    const params: string[] = [`motherduck_token=${token}`];

    // Add optional parameters
    // Default saas_mode to true for server-side security isolation
    const saasMode = credentials.saas_mode !== false;
    if (saasMode) {
      params.push('saas_mode=true');
    }

    if (credentials.attach_mode === 'single') {
      params.push('attach_mode=single');
    }

    // Format: md:database?param1=value1&param2=value2
    return `md:${database}?${params.join('&')}`;
  }

  /**
   * Execute a SQL query with optional parameters and row limiting
   */
  async query(
    sql: string,
    _params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('MotherDuck connection not initialized');
    }

    // Set query timeout (default: 120 seconds for MotherDuck cloud queries)
    const timeoutMs = timeout || TIMEOUT_CONFIG.query.default;

    // Helper function to add timeout to any query promise
    const executeWithTimeout = async <T>(
      queryPromise: Promise<T>,
      timeoutMs: number
    ): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new QueryTimeoutError(timeoutMs, sql));
        }, timeoutMs);
      });

      return Promise.race([queryPromise, timeoutPromise]);
    };

    try {
      // Apply row limit to query if specified
      const limitedSql = maxRows ? this.applyRowLimit(sql, maxRows + 1) : sql;

      // TODO: Handle parameters - DuckDB Node Neo uses prepared statements
      // For now, we'll execute without parameter binding
      // This is acceptable for a SQL client where users write full SQL

      // Execute query with timeout
      const queryPromise = this.connection.run(limitedSql);
      const result = await executeWithTimeout(queryPromise, timeoutMs);

      // Get result data
      const rows = await result.getRowObjects();
      const columnNames = result.columnNames();
      const columnTypes = result.columnTypes();

      // Check if we have more rows than requested
      const hasMoreRows = maxRows ? rows.length > maxRows : false;
      const finalRows = hasMoreRows ? rows.slice(0, maxRows) : rows;

      // Build field metadata
      const fields: FieldMetadata[] = columnNames.map((name, index) => {
        const typeInfo = columnTypes[index];
        const typeName =
          typeof typeInfo === 'string' ? typeInfo : typeInfo?.alias || typeInfo?.name || 'text';
        return {
          name,
          type: mapDuckDBType(typeName),
          nullable: true, // DuckDB doesn't expose NOT NULL in result metadata
          length: 0,
        };
      });

      return {
        rows: finalRows.map(normalizeRowValues),
        rowCount: finalRows.length,
        fields,
        hasMoreRows,
      };
    } catch (error) {
      // Use the error classification system
      throw classifyError(error, { sql, timeout: timeoutMs });
    }
  }

  /**
   * Apply row limit to SQL query
   * Handles queries that may already have a LIMIT clause
   */
  private applyRowLimit(sql: string, limit: number): string {
    const upperSql = sql.toUpperCase();

    // If query already has LIMIT, we'll wrap it in a subquery
    if (upperSql.includes('LIMIT')) {
      return `SELECT * FROM (${sql}) AS limited_query LIMIT ${limit}`;
    }

    // Otherwise, append LIMIT
    return `${sql} LIMIT ${limit}`;
  }

  /**
   * Test if the connection is still valid
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }

      // Execute a simple test query
      await this.connection.run('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the MotherDuck connection and database instance
   */
  async close(): Promise<void> {
    try {
      if (this.connection) {
        // close() may not be implemented on all versions
        if (this.connection.close) {
          await this.connection.close();
        }
        // @ts-expect-error - TypeScript doesn't allow assigning undefined to optional properties
        this.connection = undefined;
      }

      if (this.database) {
        // close() may not be implemented on all versions
        if (this.database.close) {
          await this.database.close();
        }
        // @ts-expect-error - TypeScript doesn't allow assigning undefined to optional properties
        this.database = undefined;
      }
    } catch (_error) {}
    this.connected = false;
  }

  /**
   * Get the data source type identifier
   */
  getDataSourceType(): string {
    return DataSourceType.MotherDuck;
  }

  /**
   * Get the introspector for MotherDuck schema discovery
   */
  introspect(): DataSourceIntrospector {
    this.ensureConnected();
    if (!this.introspector) {
      this.introspector = new MotherDuckIntrospector('motherduck', this);
    }
    return this.introspector;
  }
}
