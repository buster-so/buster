import type { DatabaseAdapter } from './adapters/base';
import { createAdapter } from './adapters/factory';
import type { Credentials, DataSourceType } from './types/credentials';
import type { QueryRequest, QueryResult } from './types/query';

/**
 * Data source configuration for the QueryRouter
 */
export interface DataSourceConfig {
  /** Unique identifier for this data source */
  name: string;

  /** Type of data source */
  type: DataSourceType;

  /** Credentials for connecting to the data source */
  credentials: Credentials;

  /** Additional configuration options */
  config?: Record<string, any>;
}

/**
 * Configuration for the QueryRouter
 */
export interface QueryRouterConfig {
  /** List of data source configurations */
  dataSources: DataSourceConfig[];

  /** Default data source to use if none specified */
  defaultDataSource?: string;

  /** Connection pool settings */
  poolSettings?: {
    maxConnections?: number;
    idleTimeout?: number;
    connectionTimeout?: number;
  };
}

/**
 * Main QueryRouter class that provides routing across multiple data source types
 */
export class QueryRouter {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private adapters: Map<string, DatabaseAdapter> = new Map();
  private config: QueryRouterConfig;

  constructor(config: QueryRouterConfig) {
    this.config = config;
    this.initializeDataSources();
  }

  /**
   * Initialize data source configurations
   */
  private initializeDataSources(): void {
    for (const dataSource of this.config.dataSources) {
      this.dataSources.set(dataSource.name, dataSource);
    }
  }

  /**
   * Get or create adapter for a data source
   */
  private async getAdapter(dataSourceName: string): Promise<DatabaseAdapter> {
    if (this.adapters.has(dataSourceName)) {
      return this.adapters.get(dataSourceName)!;
    }

    const dataSource = this.dataSources.get(dataSourceName);
    if (!dataSource) {
      throw new Error(`Data source '${dataSourceName}' not found`);
    }

    try {
      const adapter = await createAdapter(dataSource.credentials);
      this.adapters.set(dataSourceName, adapter);
      return adapter;
    } catch (error) {
      throw new Error(
        `Failed to create adapter for '${dataSourceName}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute a query on the specified data source
   */
  async execute<T = any>(request: QueryRequest): Promise<QueryResult<T>> {
    const dataSourceName = this.resolveDataSource(request);
    const adapter = await this.getAdapter(dataSourceName);

    try {
      const result = await adapter.query(request.sql, request.params);

      // Convert adapter result to QueryResult format
      return {
        success: true,
        rows: result.rows as T[],
        columns: result.fields.map((field) => ({
          name: field.name || 'unknown',
          type: field.type || 'unknown',
          nullable: field.nullable ?? true,
          precision: field.precision,
          scale: field.scale,
          length: field.length,
        })),
        rowsAffected: result.rowCount,
        executionTime: 0, // TODO: Add timing
        warehouse: dataSourceName,
      };
    } catch (error) {
      return {
        success: false,
        rows: [],
        columns: [],
        executionTime: 0,
        warehouse: dataSourceName,
        error: {
          code: 'QUERY_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Resolve which data source to use for the query
   */
  private resolveDataSource(request: QueryRequest): string {
    // If data source is explicitly specified in the request, use it
    if (request.warehouse) {
      if (!this.dataSources.has(request.warehouse)) {
        throw new Error(`Specified data source '${request.warehouse}' not found`);
      }
      return request.warehouse;
    }

    // Use default data source if configured
    if (this.config.defaultDataSource) {
      if (!this.dataSources.has(this.config.defaultDataSource)) {
        throw new Error(`Default data source '${this.config.defaultDataSource}' not found`);
      }
      return this.config.defaultDataSource;
    }

    // If only one data source is configured, use it
    if (this.dataSources.size === 1) {
      return Array.from(this.dataSources.keys())[0]!;
    }

    // No data source specified and no default configured
    throw new Error(
      'No data source specified in request and no default data source configured. ' +
        'Please specify a data source in the request or configure a default data source.'
    );
  }

  /**
   * Test connection to a specific data source
   */
  async testDataSource(dataSourceName: string): Promise<boolean> {
    try {
      const adapter = await this.getAdapter(dataSourceName);
      return adapter.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * Test connections to all data sources
   */
  async testAllDataSources(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const dataSourceName of this.dataSources.keys()) {
      results[dataSourceName] = await this.testDataSource(dataSourceName);
    }

    return results;
  }

  /**
   * Get list of configured data sources
   */
  getDataSources(): string[] {
    return Array.from(this.dataSources.keys());
  }

  /**
   * Get data source configuration
   */
  getDataSourceConfig(name: string): DataSourceConfig | undefined {
    return this.dataSources.get(name);
  }

  /**
   * Get data sources by type
   */
  getDataSourcesByType(type: DataSourceType): DataSourceConfig[] {
    return Array.from(this.dataSources.values()).filter((ds) => ds.type === type);
  }

  /**
   * Add a new data source configuration
   */
  async addDataSource(config: DataSourceConfig): Promise<void> {
    // Validate that we don't already have a data source with this name
    if (this.dataSources.has(config.name)) {
      throw new Error(`Data source with name '${config.name}' already exists`);
    }

    this.dataSources.set(config.name, config);

    // Test the connection by creating and connecting the adapter
    try {
      await this.getAdapter(config.name);
    } catch (error) {
      // Remove the data source if connection fails
      this.dataSources.delete(config.name);
      throw new Error(
        `Failed to add data source '${config.name}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove a data source
   */
  async removeDataSource(name: string): Promise<void> {
    const adapter = this.adapters.get(name);
    if (adapter) {
      await adapter.close();
      this.adapters.delete(name);
    }

    this.dataSources.delete(name);
  }

  /**
   * Update data source configuration
   */
  async updateDataSource(name: string, config: Partial<DataSourceConfig>): Promise<void> {
    const existingConfig = this.dataSources.get(name);
    if (!existingConfig) {
      throw new Error(`Data source '${name}' not found`);
    }

    // Disconnect existing adapter if credentials or type changed
    if (config.credentials || config.type) {
      const adapter = this.adapters.get(name);
      if (adapter) {
        await adapter.close();
        this.adapters.delete(name);
      }
    }

    // Update configuration
    const updatedConfig: DataSourceConfig = {
      ...existingConfig,
      ...config,
      name, // Ensure name doesn't change
    };

    this.dataSources.set(name, updatedConfig);

    // Test new configuration if credentials or type changed
    if (config.credentials || config.type) {
      try {
        await this.getAdapter(name);
      } catch (error) {
        // Restore original configuration if new one fails
        this.dataSources.set(name, existingConfig);
        throw new Error(
          `Failed to update data source '${name}': ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    const disconnectPromises = Array.from(this.adapters.values()).map((adapter) => adapter.close());

    await Promise.all(disconnectPromises);
    this.adapters.clear();
  }
}
