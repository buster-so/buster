import type {
  Column,
  ColumnStatistics,
  Database,
  DataSourceIntrospectionResult,
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
   * @param options Optional scoping parameters to limit introspection to specific databases, schemas, or tables
   */
  getFullIntrospection(options?: {
    databases?: string[];
    schemas?: string[];
    tables?: string[];
  }): Promise<DataSourceIntrospectionResult>;

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
   * Fetches data sequentially to take advantage of caching: databases → schemas → tables → columns → views
   */
  async getFullIntrospection(options?: {
    databases?: string[];
    schemas?: string[];
    tables?: string[];
  }): Promise<DataSourceIntrospectionResult> {
    // Validate that filter arrays are not empty
    if (options?.databases && options.databases.length === 0) {
      throw new Error(
        'Database filter array is empty. Please provide at least one database name or remove the filter.'
      );
    }
    if (options?.schemas && options.schemas.length === 0) {
      throw new Error(
        'Schema filter array is empty. Please provide at least one schema name or remove the filter.'
      );
    }
    if (options?.tables && options.tables.length === 0) {
      throw new Error(
        'Table filter array is empty. Please provide at least one table name or remove the filter.'
      );
    }

    // Fetch data sequentially to enable caching optimizations
    const allDatabases = await this.getDatabases();

    // Filter databases if specified
    const databases = options?.databases
      ? allDatabases.filter((db) => options.databases?.includes(db.name) ?? false)
      : allDatabases;

    const allSchemas = await this.getSchemas();

    // Filter schemas if specified
    let schemas = allSchemas;
    if (options?.databases) {
      // If databases are filtered, only include schemas from those databases
      schemas = schemas.filter((schema) => databases.some((db) => db.name === schema.database));
    }
    if (options?.schemas) {
      // If specific schemas are requested, filter to those
      schemas = schemas.filter((schema) => options.schemas?.includes(schema.name) ?? false);
    }

    const allTables = await this.getTables();

    // Filter tables if specified
    let tables = allTables;
    if (options?.databases) {
      // If databases are filtered, only include tables from those databases
      tables = tables.filter((table) => databases.some((db) => db.name === table.database));
    }
    if (options?.schemas) {
      // If schemas are filtered, only include tables from those schemas
      tables = tables.filter((table) =>
        schemas.some((schema) => schema.name === table.schema && schema.database === table.database)
      );
    }
    if (options?.tables) {
      // If specific tables are requested, filter to those
      tables = tables.filter((table) => options.tables?.includes(table.name) ?? false);
    }

    const allColumns = await this.getColumns();

    // Filter columns based on filtered tables
    const columns = allColumns.filter((column) =>
      tables.some(
        (table) =>
          table.name === column.table &&
          table.schema === column.schema &&
          table.database === column.database
      )
    );

    const allViews = await this.getViews();

    // Filter views if specified
    let views = allViews;
    if (options?.databases) {
      // If databases are filtered, only include views from those databases
      views = views.filter((view) => databases.some((db) => db.name === view.database));
    }
    if (options?.schemas) {
      // If schemas are filtered, only include views from those schemas
      views = views.filter((view) =>
        schemas.some((schema) => schema.name === view.schema && schema.database === view.database)
      );
    }

    // Get indexes and foreign keys if supported
    const indexes =
      'getIndexes' in this && typeof this.getIndexes === 'function'
        ? await (this as DataSourceIntrospector & { getIndexes(): Promise<Index[]> }).getIndexes()
        : [];
    const foreignKeys =
      'getForeignKeys' in this && typeof this.getForeignKeys === 'function'
        ? await (
            this as DataSourceIntrospector & { getForeignKeys(): Promise<ForeignKey[]> }
          ).getForeignKeys()
        : [];

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
                  column.distinctCount = stat.distinctCount ?? 0;
                  column.nullCount = stat.nullCount ?? 0;
                  column.minValue = stat.minValue ?? '';
                  column.maxValue = stat.maxValue ?? '';
                  // Apply smart truncation to sample values
                  column.sampleValues = this.truncateSampleValues(stat.sampleValues, column) ?? '';
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

  /**
   * Helper method to apply smart truncation to sample values
   */
  protected truncateSampleValues(
    sampleValues: string | undefined,
    column: Column
  ): string | undefined {
    if (!sampleValues || sampleValues.trim().length === 0) return undefined;

    const values = sampleValues.split(',').filter((v) => v.trim().length > 0);
    if (values.length === 0) return undefined;

    const dataType = column.dataType.toLowerCase();

    // Handle JSON columns - fewer samples, smart truncation
    if (dataType.includes('json') || dataType.includes('jsonb')) {
      return this.truncateJsonSamples(values);
    }

    // Handle long text columns - adaptive sample count
    if (this.isLongTextColumn(column, values)) {
      return this.truncateLongTextSamples(values);
    }

    // Handle normal columns - standard truncation
    return this.truncateNormalSamples(values);
  }

  /**
   * Truncate JSON sample values - show fewer samples with smart truncation
   */
  private truncateJsonSamples(values: string[]): string {
    return values
      .slice(0, 3) // Only show 3 JSON samples
      .map((value) => {
        if (value.length > 100) {
          // Try to truncate at a logical JSON boundary
          const truncated = value.substring(0, 100);
          const lastComma = truncated.lastIndexOf(',');
          const lastBrace = truncated.lastIndexOf('}');
          const cutPoint = Math.max(lastComma, lastBrace);

          if (cutPoint > 50) {
            return `${truncated.substring(0, cutPoint)}...}`;
          }
          return `${truncated}...`;
        }
        return value;
      })
      .join(',');
  }

  /**
   * Truncate long text sample values - fewer samples, shorter truncation
   */
  private truncateLongTextSamples(values: string[]): string {
    const avgLength = values.reduce((sum, v) => sum + v.length, 0) / values.length;
    const sampleCount = avgLength > 200 ? 3 : avgLength > 100 ? 5 : 10;
    const truncateLength = avgLength > 200 ? 30 : 50;

    return values
      .slice(0, sampleCount)
      .map((value) => {
        if (value.length > truncateLength) {
          return `${value.substring(0, truncateLength)}...`;
        }
        return value;
      })
      .join(',');
  }

  /**
   * Truncate normal sample values - standard approach
   */
  private truncateNormalSamples(values: string[]): string {
    return values
      .slice(0, 20)
      .map((value) => {
        if (value.length > 100) {
          return `${value.substring(0, 100)}...`;
        }
        return value;
      })
      .join(',');
  }

  /**
   * Check if this is a long text column based on type and sample values
   */
  private isLongTextColumn(column: Column, values: string[]): boolean {
    const dataType = column.dataType.toLowerCase();

    // Check data type indicators
    if (dataType.includes('text') || dataType.includes('varchar') || dataType.includes('char')) {
      // Check if max length suggests long text
      if (column.maxLength && column.maxLength > 255) {
        return true;
      }

      // Check if sample values are long
      const avgLength = values.reduce((sum, v) => sum + v.length, 0) / values.length;
      return avgLength > 100;
    }

    return false;
  }
}
