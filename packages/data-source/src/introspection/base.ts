import type {
  Column,
  ColumnStatistics,
  DataSourceIntrospectionResult,
  Database,
  ForeignKey,
  Index,
  Schema,
  Table,
  TableStatistics,
  View,
} from '../types/introspection';

/**
 * Base interface for data source introspection capabilities
 */
export interface DataSourceIntrospector {
  /**
   * Get all databases in the data source
   */
  getDatabases(): Promise<Database[]>;

  /**
   * Get all schemas in a database (or all schemas if no database specified)
   */
  getSchemas(database?: string): Promise<Schema[]>;

  /**
   * Get all tables in a schema (or all tables if no schema/database specified)
   */
  getTables(database?: string, schema?: string): Promise<Table[]>;

  /**
   * Get all columns in a table (or all columns if no table/schema/database specified)
   */
  getColumns(database?: string, schema?: string, table?: string): Promise<Column[]>;

  /**
   * Get all views in a schema (or all views if no schema/database specified)
   */
  getViews(database?: string, schema?: string): Promise<View[]>;

  /**
   * Get statistical information for a specific table (basic table-level stats only)
   */
  getTableStatistics(database: string, schema: string, table: string): Promise<TableStatistics>;

  /**
   * Get column statistics for all columns in a specific table
   */
  getColumnStatistics(database: string, schema: string, table: string): Promise<ColumnStatistics[]>;

  /**
   * Get all indexes in a schema (or all indexes if no schema/database specified)
   * Note: Not all data sources support indexes
   */
  getIndexes?(database?: string, schema?: string): Promise<Index[]>;

  /**
   * Get all foreign key constraints in a schema (or all foreign keys if no schema/database specified)
   * Note: Not all data sources support foreign keys
   */
  getForeignKeys?(database?: string, schema?: string): Promise<ForeignKey[]>;

  /**
   * Get comprehensive introspection data for the entire data source
   */
  getFullIntrospection(): Promise<DataSourceIntrospectionResult>;

  /**
   * Get the data source type this introspector handles
   */
  getDataSourceType(): string;
}

/**
 * Base implementation of DataSourceIntrospector with common functionality
 */
export abstract class BaseIntrospector implements DataSourceIntrospector {
  protected dataSourceName: string;

  constructor(dataSourceName: string) {
    this.dataSourceName = dataSourceName;
  }

  abstract getDatabases(): Promise<Database[]>;
  abstract getSchemas(database?: string): Promise<Schema[]>;
  abstract getTables(database?: string, schema?: string): Promise<Table[]>;
  abstract getColumns(database?: string, schema?: string, table?: string): Promise<Column[]>;
  abstract getViews(database?: string, schema?: string): Promise<View[]>;
  abstract getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics>;
  abstract getColumnStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<ColumnStatistics[]>;
  abstract getDataSourceType(): string;

  /**
   * Default implementation of getFullIntrospection that combines all introspection methods
   */
  async getFullIntrospection(): Promise<DataSourceIntrospectionResult> {
    const [databases, schemas, tables, columns, views] = await Promise.all([
      this.getDatabases(),
      this.getSchemas(),
      this.getTables(),
      this.getColumns(),
      this.getViews(),
    ]);

    // Get indexes and foreign keys if supported
    const indexes =
      'getIndexes' in this && typeof this.getIndexes === 'function'
        ? await (this as DataSourceIntrospector & { getIndexes(): Promise<Index[]> }).getIndexes()
        : undefined;
    const foreignKeys =
      'getForeignKeys' in this && typeof this.getForeignKeys === 'function'
        ? await (
            this as DataSourceIntrospector & { getForeignKeys(): Promise<ForeignKey[]> }
          ).getForeignKeys()
        : undefined;

    // Get column statistics in batches of 20 tables
    const columnsWithStats = await this.attachColumnStatistics(tables, columns);

    return {
      dataSourceName: this.dataSourceName,
      dataSourceType: this.getDataSourceType(),
      databases,
      schemas,
      tables,
      columns: columnsWithStats,
      views,
      indexes,
      foreignKeys,
      introspectedAt: new Date(),
    };
  }

  /**
   * Attach column statistics to columns by processing tables in batches
   */
  private async attachColumnStatistics(tables: Table[], columns: Column[]): Promise<Column[]> {
    // Create a map for quick column lookup
    const columnMap = new Map<string, Column>();
    for (const column of columns) {
      const key = `${column.database}.${column.schema}.${column.table}.${column.name}`;
      columnMap.set(key, { ...column });
    }

    // Process tables in batches of 20
    const batchSize = 20;
    const tableBatches: Table[][] = [];
    for (let i = 0; i < tables.length; i += batchSize) {
      tableBatches.push(tables.slice(i, i + batchSize));
    }

    // Process each batch in parallel
    await Promise.all(
      tableBatches.map(async (batch) => {
        // Process all tables in this batch in parallel
        await Promise.all(
          batch.map(async (table) => {
            try {
              const columnStats = await this.getColumnStatistics(
                table.database,
                table.schema,
                table.name
              );

              // Attach statistics to corresponding columns
              for (const stat of columnStats) {
                const key = `${table.database}.${table.schema}.${table.name}.${stat.columnName}`;
                const column = columnMap.get(key);
                if (column) {
                  column.distinctCount = stat.distinctCount;
                  column.nullCount = stat.nullCount;
                  column.minValue = stat.minValue;
                  column.maxValue = stat.maxValue;
                  column.sampleValues = stat.sampleValues;
                }
              }
            } catch (error) {
              // Log warning but don't fail the entire introspection
              console.warn(
                `Failed to get column statistics for table ${table.database}.${table.schema}.${table.name}:`,
                error
              );
            }
          })
        );
      })
    );

    return Array.from(columnMap.values());
  }

  /**
   * Helper method to safely parse dates from database results
   */
  protected parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }

  /**
   * Helper method to safely parse numbers from database results
   */
  protected parseNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  /**
   * Helper method to safely parse booleans from database results
   */
  protected parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'yes' || lower === '1';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  /**
   * Helper method to safely get string values from database results
   */
  protected getString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    return String(value);
  }
}
