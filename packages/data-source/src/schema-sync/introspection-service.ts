import type { DataSourceConfig, DataSourceManagerConfig } from '../data-source';
import { DataSource } from '../data-source';
import type { Column } from '../types/introspection';

/**
 * Result of introspecting a database/schema combination
 */
export interface IntrospectionResult {
  database: string;
  schema: string;
  tables: TableWithColumns[];
  introspectedAt: Date;
  error?: string;
}

/**
 * Table with its columns
 */
export interface TableWithColumns {
  name: string;
  columns: Column[];
}

/**
 * Lightweight schema introspection service
 * Performs minimal queries to get table and column information
 */
export class SchemaIntrospectionService {
  private dataSource: DataSource;
  private dataSourceName: string;

  constructor(config: DataSourceConfig) {
    const managerConfig: DataSourceManagerConfig = {
      dataSources: [config],
    };
    this.dataSource = new DataSource(managerConfig);
    this.dataSourceName = config.name;
  }

  /**
   * Introspect a specific database/schema combination
   * @param database Database name
   * @param schema Schema name
   * @returns Introspection result with tables and columns
   */
  async introspectDatabaseSchema(database: string, schema: string): Promise<IntrospectionResult> {
    try {
      // Get tables for the specific database/schema
      const tables = await this.dataSource.getTables(this.dataSourceName, database, schema);

      // Get columns for all tables in one query (lightweight approach)
      const tablesWithColumns: TableWithColumns[] = [];

      for (const table of tables) {
        const columns = await this.dataSource.getColumns(
          this.dataSourceName,
          database,
          schema,
          table.name
        );

        tablesWithColumns.push({
          name: table.name,
          columns,
        });
      }

      return {
        database,
        schema,
        tables: tablesWithColumns,
        introspectedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error introspecting ${database}.${schema}:`, error);
      return {
        database,
        schema,
        tables: [],
        introspectedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Introspect multiple database/schema combinations
   * @param combinations Array of database/schema pairs
   * @returns Array of introspection results
   */
  async introspectMultiple(
    combinations: Array<{ database: string; schema: string }>
  ): Promise<IntrospectionResult[]> {
    const results: IntrospectionResult[] = [];

    // Process each combination sequentially to avoid overwhelming the data source
    for (const combo of combinations) {
      const result = await this.introspectDatabaseSchema(combo.database, combo.schema);
      results.push(result);
    }

    return results;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.dataSource.close();
  }
}

/**
 * Create introspection service for a data source
 * @param credentials Data source credentials
 * @returns Schema introspection service instance
 */
export function createIntrospectionService(config: DataSourceConfig): SchemaIntrospectionService {
  return new SchemaIntrospectionService(config);
}
