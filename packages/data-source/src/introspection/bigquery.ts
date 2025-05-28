import type { DatabaseAdapter } from '../adapters/base';
import { DataSourceType } from '../types/credentials';
import type {
  Column,
  ColumnStatistics,
  Database,
  Schema,
  Table,
  TableStatistics,
  View,
} from '../types/introspection';
import { BaseIntrospector } from './base';

/**
 * BigQuery-specific introspector implementation
 * Uses BigQuery's INFORMATION_SCHEMA for metadata queries
 * Optimized to batch metadata queries for efficiency
 */
export class BigQueryIntrospector extends BaseIntrospector {
  private adapter: DatabaseAdapter;
  private metadataCache: {
    databases?: Database[];
    schemas?: Schema[];
    tables?: Table[];
    columns?: Column[];
    views?: View[];
    lastFetched?: Date;
  } = {};

  constructor(dataSourceName: string, adapter: DatabaseAdapter) {
    super(dataSourceName);
    this.adapter = adapter;
  }

  getDataSourceType(): string {
    return DataSourceType.BigQuery;
  }

  /**
   * Fetch all metadata in batched queries for efficiency
   */
  private async fetchAllMetadata(): Promise<void> {
    // Only fetch if not cached or cache is older than 5 minutes
    const cacheAge = this.metadataCache.lastFetched
      ? Date.now() - this.metadataCache.lastFetched.getTime()
      : Number.POSITIVE_INFINITY;

    if (cacheAge < 5 * 60 * 1000 && this.metadataCache.databases) {
      return; // Use cached data
    }

    try {
      // Query 1: Get all datasets (databases/schemas)
      const datasetsResult = await this.adapter.query(`
        SELECT schema_name as dataset_name,
               catalog_name as project_name,
               location,
               creation_time
        FROM INFORMATION_SCHEMA.SCHEMATA
        WHERE schema_name NOT IN ('INFORMATION_SCHEMA')
        ORDER BY schema_name
      `);

      // Query 2: Get all tables and views in one query
      const tablesAndViewsResult = await this.adapter.query(`
        SELECT table_catalog as project_name,
               table_schema as dataset_name,
               table_name,
               table_type,
               creation_time,
               ddl
        FROM INFORMATION_SCHEMA.TABLES
        WHERE table_type IN ('BASE TABLE', 'VIEW', 'EXTERNAL')
        ORDER BY table_schema, table_name
      `);

      // Query 3: Get all columns
      const columnsResult = await this.adapter.query(`
        SELECT table_catalog as project_name,
               table_schema as dataset_name,
               table_name,
               column_name,
               ordinal_position,
               data_type,
               is_nullable,
               column_default,
               is_generated,
               generation_expression,
               is_stored,
               is_hidden,
               is_updatable,
               is_system_defined,
               is_partitioning_column,
               clustering_ordinal_position
        FROM INFORMATION_SCHEMA.COLUMNS
        ORDER BY table_schema, table_name, ordinal_position
      `);

      // Query 4: Get all view definitions
      const viewsResult = await this.adapter.query(`
        SELECT table_catalog as project_name,
               table_schema as dataset_name,
               table_name as view_name,
               view_definition
        FROM INFORMATION_SCHEMA.VIEWS
        ORDER BY table_schema, table_name
      `);

      // Process datasets into databases and schemas
      this.metadataCache.databases = datasetsResult.rows.map((row) => ({
        name: this.getString(row.dataset_name) || '',
        created: this.parseDate(row.creation_time),
        metadata: {
          project_name: this.getString(row.project_name),
          location: this.getString(row.location),
        },
      }));

      this.metadataCache.schemas = datasetsResult.rows.map((row) => ({
        name: this.getString(row.dataset_name) || '',
        database: this.getString(row.project_name) || 'default_project',
        created: this.parseDate(row.creation_time),
        metadata: {
          project_name: this.getString(row.project_name),
          location: this.getString(row.location),
        },
      }));

      // Process tables and separate views
      this.metadataCache.tables = [];
      this.metadataCache.views = [];

      for (const row of tablesAndViewsResult.rows) {
        const tableType = this.getString(row.table_type);
        const tableData = {
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.dataset_name) || '',
          database: this.getString(row.project_name) || '',
          type: this.mapTableType(tableType),
          created: this.parseDate(row.creation_time),
          metadata: {
            ddl: this.getString(row.ddl),
          },
        };

        if (tableType?.toUpperCase().includes('VIEW')) {
          // Find corresponding view definition
          const viewDef = viewsResult.rows.find(
            (v) =>
              this.getString(v.dataset_name) === tableData.schema &&
              this.getString(v.view_name) === tableData.name
          );

          this.metadataCache.views.push({
            name: tableData.name,
            schema: tableData.schema,
            database: tableData.database,
            definition: this.getString(viewDef?.view_definition) || '',
          });
        } else {
          this.metadataCache.tables.push(tableData);
        }
      }

      // Process columns
      this.metadataCache.columns = columnsResult.rows.map((row) => ({
        name: this.getString(row.column_name) || '',
        table: this.getString(row.table_name) || '',
        schema: this.getString(row.dataset_name) || '',
        database: this.getString(row.project_name) || '',
        position: this.parseNumber(row.ordinal_position) || 0,
        dataType: this.getString(row.data_type) || '',
        isNullable: this.getString(row.is_nullable) === 'YES',
        defaultValue: this.getString(row.column_default),
        metadata: {
          is_generated: this.parseBoolean(row.is_generated),
          generation_expression: this.getString(row.generation_expression),
          is_stored: this.parseBoolean(row.is_stored),
          is_hidden: this.parseBoolean(row.is_hidden),
          is_partitioning_column: this.parseBoolean(row.is_partitioning_column),
          clustering_ordinal_position: this.parseNumber(row.clustering_ordinal_position),
        },
      }));

      this.metadataCache.lastFetched = new Date();
    } catch (error) {
      console.warn('Failed to fetch BigQuery metadata:', error);
      // Initialize empty arrays to prevent repeated failures
      this.metadataCache.databases = [];
      this.metadataCache.schemas = [];
      this.metadataCache.tables = [];
      this.metadataCache.columns = [];
      this.metadataCache.views = [];
      this.metadataCache.lastFetched = new Date();
    }
  }

  async getDatabases(): Promise<Database[]> {
    await this.fetchAllMetadata();
    return this.metadataCache.databases || [];
  }

  async getSchemas(database?: string): Promise<Schema[]> {
    await this.fetchAllMetadata();
    const schemas = this.metadataCache.schemas || [];

    if (database) {
      return schemas.filter((schema) => schema.database === database);
    }
    return schemas;
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    await this.fetchAllMetadata();
    let tables = this.metadataCache.tables || [];

    if (database && schema) {
      tables = tables.filter((table) => table.database === database && table.schema === schema);
    } else if (database || schema) {
      const targetDataset = database || schema;
      tables = tables.filter((table) => table.schema === targetDataset);
    }

    // Enhance tables with basic statistics
    const tablesWithStats = await Promise.all(
      tables.map(async (table) => {
        try {
          // Get basic table statistics using BigQuery's INFORMATION_SCHEMA
          const tableStatsResult = await this.adapter.query(`
            SELECT row_count,
                   size_bytes
            FROM \`${table.schema}\`.\`__TABLES__\`
            WHERE table_id = '${table.name}'
          `);

          const stats = tableStatsResult.rows[0];
          return {
            ...table,
            rowCount: this.parseNumber(stats?.row_count),
            sizeBytes: this.parseNumber(stats?.size_bytes),
          };
        } catch (error) {
          // If stats query fails, return table without stats
          console.warn(`Failed to get stats for table ${table.schema}.${table.name}:`, error);
          return table;
        }
      })
    );

    return tablesWithStats;
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    await this.fetchAllMetadata();
    let columns = this.metadataCache.columns || [];

    if (database && schema && table) {
      columns = columns.filter(
        (col) => col.database === database && col.schema === schema && col.table === table
      );
    } else if (database || schema) {
      const targetDataset = database || schema;
      columns = columns.filter((col) => col.schema === targetDataset);

      if (table) {
        columns = columns.filter((col) => col.table === table);
      }
    }

    return columns;
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    await this.fetchAllMetadata();
    let views = this.metadataCache.views || [];

    if (database && schema) {
      views = views.filter((view) => view.database === database && view.schema === schema);
    } else if (database || schema) {
      const targetDataset = database || schema;
      views = views.filter((view) => view.schema === targetDataset);
    }

    return views;
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    const targetDataset = database || schema;

    // Get basic table statistics only (no column statistics)
    const tableStatsResult = await this.adapter.query(`
      SELECT row_count,
             size_bytes,
             last_modified_time
      FROM \`${targetDataset}\`.\`__TABLES__\`
      WHERE table_id = '${table}'
    `);

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema: targetDataset,
      database: targetDataset,
      rowCount: this.parseNumber(basicStats?.row_count),
      sizeBytes: this.parseNumber(basicStats?.size_bytes),
      columnStatistics: [], // No column statistics in basic table stats
      lastUpdated: this.parseDate(basicStats?.last_modified_time) || new Date(),
    };
  }

  /**
   * Get column statistics for all columns in a specific table
   */
  async getColumnStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<ColumnStatistics[]> {
    const targetDataset = database || schema;
    // Get columns for this table
    const columns = await this.getColumns(targetDataset, undefined, table);
    return this.getColumnStatisticsForColumns(targetDataset, table, columns);
  }

  /**
   * Get column statistics using UNION query approach
   */
  private async getColumnStatisticsForColumns(
    dataset: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    // Build UNION query with one SELECT per column, cast to string for compatibility
    const unionClauses = columns.map((column) =>
      this.buildColumnStatsClause(column, dataset, table)
    );

    try {
      const statsQuery = unionClauses.join('\n\nUNION ALL\n');
      const statsResult = await this.adapter.query(statsQuery);

      // Parse results - each row represents one column's statistics
      for (const row of statsResult.rows) {
        if (row) {
          columnStatistics.push({
            columnName: this.getString(row.column_name) || '',
            distinctCount: this.parseNumber(row.distinct_count),
            nullCount: this.parseNumber(row.null_count),
            minValue: row.min_value,
            maxValue: row.max_value,
            sampleValues: this.getString(row.sample_values),
          });
        }
      }
    } catch (error) {
      console.warn(`Could not get statistics for table ${table}:`, error);

      // Fallback: create empty statistics for each column
      for (const column of columns) {
        columnStatistics.push({
          columnName: column.name,
          distinctCount: undefined,
          nullCount: undefined,
          minValue: undefined,
          maxValue: undefined,
          sampleValues: undefined,
        });
      }
    }

    return columnStatistics;
  }

  /**
   * Build a single column statistics clause for UNION query
   */
  private buildColumnStatsClause(column: Column, dataset: string, table: string): string {
    const columnName = column.name;
    const isNumeric = this.isNumericType(column.dataType);
    const isDate = this.isDateType(column.dataType);

    let unionClause = `
      SELECT '${columnName}' AS column_name,
             COUNT(DISTINCT \`${columnName}\`) AS distinct_count,
             COUNT(*) - COUNT(\`${columnName}\`) AS null_count`;

    // Add min/max for numeric and date columns, cast to string for UNION compatibility
    if (isNumeric) {
      unionClause += `,
             CAST(MIN(\`${columnName}\`) AS STRING) AS min_value,
             CAST(MAX(\`${columnName}\`) AS STRING) AS max_value`;
    } else if (isDate) {
      unionClause += `,
             CAST(MIN(\`${columnName}\`) AS STRING) AS min_value,
             CAST(MAX(\`${columnName}\`) AS STRING) AS max_value`;
    } else {
      unionClause += `,
             NULL AS min_value,
             NULL AS max_value`;
    }

    // Add sample values - get up to 20 distinct values, truncated and comma-separated
    unionClause += `,
             (
               SELECT STRING_AGG(
                 CASE 
                   WHEN LENGTH(sample_val) > 100 
                   THEN CONCAT(SUBSTR(sample_val, 1, 100), '...')
                   ELSE sample_val
                 END, 
                 ','
                 ORDER BY sample_val
               )
               FROM (
                 SELECT DISTINCT CAST(\`${columnName}\` AS STRING) as sample_val
                 FROM \`${dataset}\`.\`${table}\`
                 WHERE \`${columnName}\` IS NOT NULL
                 LIMIT 20
               )
             ) AS sample_values`;

    unionClause += `
      FROM \`${dataset}\`.\`${table}\``;

    return unionClause;
  }

  /**
   * Map BigQuery table types to our standard types
   */
  private mapTableType(
    bigQueryType: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (!bigQueryType) return 'TABLE';

    const type = bigQueryType.toUpperCase();
    if (type.includes('VIEW')) return 'VIEW';
    if (type.includes('EXTERNAL')) return 'EXTERNAL_TABLE';
    if (type.includes('BASE TABLE')) return 'TABLE';
    return 'TABLE';
  }

  /**
   * Check if a data type is numeric for statistics purposes
   */
  private isNumericType(dataType: string): boolean {
    const numericTypes = [
      'int64',
      'integer',
      'float64',
      'float',
      'numeric',
      'decimal',
      'bignumeric',
      'bigdecimal',
    ];

    return numericTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * Check if a data type is date for statistics purposes
   */
  private isDateType(dataType: string): boolean {
    const dateTypes = ['date', 'datetime', 'timestamp', 'time'];

    return dateTypes.some((type) => dataType.toLowerCase().includes(type));
  }
}
