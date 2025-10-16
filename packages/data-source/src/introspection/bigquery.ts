import type { DatabaseAdapter } from '../adapters/base';
import { DataSourceType } from '../types/credentials';
import type {
  Column,
  ColumnStatistics,
  Database,
  DataSourceIntrospectionResult,
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
  private cache: {
    databases?: { data: Database[]; lastFetched: Date };
    schemas?: { data: Schema[]; lastFetched: Date };
    tables?: { data: Table[]; lastFetched: Date };
    columns?: { data: Column[]; lastFetched: Date };
    views?: { data: View[]; lastFetched: Date };
  } = {};

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(dataSourceName: string, adapter: DatabaseAdapter) {
    super(dataSourceName);
    this.adapter = adapter;
  }

  getDataSourceType(): string {
    return DataSourceType.BigQuery;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(lastFetched: Date): boolean {
    return Date.now() - lastFetched.getTime() < this.CACHE_TTL;
  }

  async getDatabases(): Promise<Database[]> {
    // Check if we have valid cached data
    if (this.cache.databases && this.isCacheValid(this.cache.databases.lastFetched)) {
      return this.cache.databases.data;
    }

    try {
      // Query: Get all datasets (databases/schemas)
      const datasetsResult = await this.adapter.query(`
        SELECT schema_name as dataset_name,
               catalog_name as project_name,
               location,
               creation_time
        FROM INFORMATION_SCHEMA.SCHEMATA
        WHERE schema_name NOT IN ('INFORMATION_SCHEMA')
        ORDER BY schema_name
      `);

      const databases = datasetsResult.rows.map((row) => ({
        name: this.getString(row.dataset_name) || '',
        created: this.parseDate(row.creation_time) || new Date(),
        metadata: {
          project_name: this.getString(row.project_name),
          location: this.getString(row.location),
        },
      }));

      this.cache.databases = { data: databases, lastFetched: new Date() };
      return databases;
    } catch (error) {
      console.warn('Failed to fetch BigQuery databases:', error);
      return [];
    }
  }

  async getSchemas(database?: string): Promise<Schema[]> {
    // Only use cache if no filter is applied
    if (!database && this.cache.schemas && this.isCacheValid(this.cache.schemas.lastFetched)) {
      return this.cache.schemas.data;
    }

    try {
      let query = `
        SELECT schema_name as dataset_name,
               catalog_name as project_name,
               location,
               creation_time
        FROM INFORMATION_SCHEMA.SCHEMATA
        WHERE schema_name NOT IN ('INFORMATION_SCHEMA')
      `;

      if (database) {
        query += ` AND catalog_name = '${database}'`;
      }

      query += ' ORDER BY schema_name';

      const datasetsResult = await this.adapter.query(query);

      const schemas = datasetsResult.rows.map((row) => ({
        name: this.getString(row.dataset_name) || '',
        database: this.getString(row.project_name) || 'default_project',
        created: this.parseDate(row.creation_time) || new Date(),
        metadata: {
          project_name: this.getString(row.project_name),
          location: this.getString(row.location),
        },
      }));

      // Only cache if no filter was applied
      if (!database) {
        this.cache.schemas = { data: schemas, lastFetched: new Date() };
      }

      return schemas;
    } catch (error) {
      console.warn('Failed to fetch BigQuery schemas:', error);
      return [];
    }
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    try {
      let whereClause = "WHERE table_type IN ('BASE TABLE', 'VIEW', 'EXTERNAL')";

      if (database && schema) {
        whereClause += ` AND table_catalog = '${database}' AND table_schema = '${schema}'`;
      } else if (database || schema) {
        const targetDataset = database || schema;
        whereClause += ` AND table_schema = '${targetDataset}'`;
      }

      const tablesResult = await this.adapter.query(`
        SELECT table_catalog as project_name,
               table_schema as dataset_name,
               table_name,
               table_type,
               creation_time,
               ddl
        FROM INFORMATION_SCHEMA.TABLES
        ${whereClause}
        ORDER BY table_schema, table_name
      `);

      const tables = tablesResult.rows
        .filter((row) => !this.getString(row.table_type)?.toUpperCase().includes('VIEW'))
        .map((row) => ({
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.dataset_name) || '',
          database: this.getString(row.project_name) || '',
          type: this.mapTableType(this.getString(row.table_type)),
          created: this.parseDate(row.creation_time) || new Date(),
          metadata: {
            ddl: this.getString(row.ddl),
          },
        }));

      // Enhance tables with basic statistics
      const tablesWithStats = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableStatsResult = await this.adapter.query(`
              SELECT row_count,
                     size_bytes
              FROM \`${table.schema}\`.\`__TABLES__\`
              WHERE table_id = '${table.name}'
            `);

            const stats = tableStatsResult.rows[0];
            return {
              ...table,
              rowCount: this.parseNumber(stats?.row_count) ?? 0,
              sizeBytes: this.parseNumber(stats?.size_bytes) ?? 0,
            };
          } catch (error) {
            console.warn(`Failed to get stats for table ${table.schema}.${table.name}:`, error);
            return table;
          }
        })
      );

      return tablesWithStats;
    } catch (error) {
      console.warn('Failed to fetch BigQuery tables:', error);
      return [];
    }
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    try {
      let whereClause = '';

      if (database && schema && table) {
        whereClause = `WHERE table_catalog = '${database}' AND table_schema = '${schema}' AND table_name = '${table}'`;
      } else if (database || schema) {
        const targetDataset = database || schema;
        whereClause = `WHERE table_schema = '${targetDataset}'`;
        if (table) {
          whereClause += ` AND table_name = '${table}'`;
        }
      } else if (table) {
        whereClause = `WHERE table_name = '${table}'`;
      }

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
        ${whereClause}
        ORDER BY table_schema, table_name, ordinal_position
      `);

      return columnsResult.rows.map((row) => ({
        name: this.getString(row.column_name) || '',
        table: this.getString(row.table_name) || '',
        schema: this.getString(row.dataset_name) || '',
        database: this.getString(row.project_name) || '',
        position: this.parseNumber(row.ordinal_position) || 0,
        dataType: this.getString(row.data_type) || '',
        isNullable: this.getString(row.is_nullable) === 'YES',
        defaultValue: this.getString(row.column_default) || '',
        metadata: {
          is_generated: this.parseBoolean(row.is_generated),
          generation_expression: this.getString(row.generation_expression),
          is_stored: this.parseBoolean(row.is_stored),
          is_hidden: this.parseBoolean(row.is_hidden),
          is_partitioning_column: this.parseBoolean(row.is_partitioning_column),
          clustering_ordinal_position: this.parseNumber(row.clustering_ordinal_position),
        },
      }));
    } catch (error) {
      console.warn('Failed to fetch BigQuery columns:', error);
      return [];
    }
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    try {
      let whereClause = '';

      if (database && schema) {
        whereClause = `WHERE table_catalog = '${database}' AND table_schema = '${schema}'`;
      } else if (database || schema) {
        const targetDataset = database || schema;
        whereClause = `WHERE table_schema = '${targetDataset}'`;
      }

      const viewsResult = await this.adapter.query(`
        SELECT table_catalog as project_name,
               table_schema as dataset_name,
               table_name as view_name,
               view_definition
        FROM INFORMATION_SCHEMA.VIEWS
        ${whereClause}
        ORDER BY table_schema, table_name
      `);

      return viewsResult.rows.map((row) => ({
        name: this.getString(row.view_name) || '',
        schema: this.getString(row.dataset_name) || '',
        database: this.getString(row.project_name) || '',
        definition: this.getString(row.view_definition) || '',
      }));
    } catch (error) {
      console.warn('Failed to fetch BigQuery views:', error);
      return [];
    }
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
      rowCount: this.parseNumber(basicStats?.row_count) ?? 0,
      sizeBytes: this.parseNumber(basicStats?.size_bytes) ?? 0,
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
   * Get column statistics using optimized CTE approach with single table scan
   */
  private async getColumnStatisticsForColumns(
    dataset: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    try {
      // Build the optimized CTE-based query
      const statsQuery = this.buildOptimizedColumnStatsQuery(dataset, table, columns);
      const statsResult = await this.adapter.query(statsQuery);

      // Parse results - each row represents one column's statistics
      for (const row of statsResult.rows) {
        if (row) {
          columnStatistics.push({
            columnName: this.getString(row.column_name) || '',
            distinctCount: this.parseNumber(row.distinct_count) ?? 0,
            nullCount: this.parseNumber(row.null_count) ?? 0,
            minValue: this.getString(row.min_value) ?? '',
            maxValue: this.getString(row.max_value) ?? '',
            sampleValues: this.getString(row.sample_values) ?? '',
          });
        }
      }
    } catch (error) {
      console.warn(`Could not get statistics for table ${table}:`, error);

      // Fallback: create empty statistics for each column
      for (const column of columns) {
        columnStatistics.push({
          columnName: column.name,
          distinctCount: 0,
          nullCount: 0,
          minValue: '',
          maxValue: '',
          sampleValues: '',
        });
      }
    }

    return columnStatistics;
  }

  /**
   * Build optimized CTE-based query that scans the table only once
   */
  private buildOptimizedColumnStatsQuery(
    dataset: string,
    table: string,
    columns: Column[]
  ): string {
    const fullyQualifiedTable = `\`${dataset}\`.\`${table}\``;

    // Build raw_stats CTE with all column statistics in one scan
    const rawStatsSelects = columns
      .map((column) => {
        const columnName = column.name;
        const isNumeric = this.isNumericType(column.dataType);
        const isDate = this.isDateType(column.dataType);

        let selectClause = `
        COUNT(DISTINCT \`${columnName}\`) AS distinct_count_${this.sanitizeColumnName(columnName)},
        COUNTIF(\`${columnName}\` IS NULL) AS null_count_${this.sanitizeColumnName(columnName)}`;

        if (isNumeric || isDate) {
          selectClause += `,
        MIN(\`${columnName}\`) AS min_${this.sanitizeColumnName(columnName)},
        MAX(\`${columnName}\`) AS max_${this.sanitizeColumnName(columnName)}`;
        }

        return selectClause;
      })
      .join(',');

    // Build sample_values CTE with UNION ALL for each column
    const sampleValuesUnions = columns
      .map((column) => {
        const columnName = column.name;
        return `
    SELECT '${columnName}' AS column_name,
           STRING_AGG(
               CASE 
                   WHEN LENGTH(sample_val) > 100 
                   THEN CONCAT(SUBSTR(sample_val, 1, 100), '...')
                   ELSE sample_val
               END, 
               ','
               ORDER BY sample_val
           ) AS sample_values
    FROM (
        SELECT DISTINCT CAST(\`${columnName}\` AS STRING) AS sample_val
        FROM sample_data
        WHERE \`${columnName}\` IS NOT NULL
        LIMIT 20
    )`;
      })
      .join('\n    UNION ALL');

    // Build stats CTE with UNION ALL for each column
    const statsUnions = columns
      .map((column) => {
        const columnName = column.name;
        const sanitizedName = this.sanitizeColumnName(columnName);
        const isNumeric = this.isNumericType(column.dataType);
        const isDate = this.isDateType(column.dataType);

        let minMaxClause = 'NULL AS min_value,\n        NULL AS max_value';
        if (isNumeric || isDate) {
          minMaxClause = `CAST(rs.min_${sanitizedName} AS STRING) AS min_value,
        CAST(rs.max_${sanitizedName} AS STRING) AS max_value`;
        }

        return `
    SELECT
        '${columnName}' AS column_name,
        rs.distinct_count_${sanitizedName} AS distinct_count,
        rs.null_count_${sanitizedName} AS null_count,
        ${minMaxClause}
    FROM raw_stats rs`;
      })
      .join('\n    UNION ALL');

    // Combine all CTEs into final query
    return `
WITH raw_stats AS (
    SELECT
        ${rawStatsSelects}
    FROM ${fullyQualifiedTable}
),
sample_data AS (
    SELECT * FROM ${fullyQualifiedTable} TABLESAMPLE SYSTEM (1 PERCENT)
),
sample_values AS (
    ${sampleValuesUnions}
),
stats AS (
    ${statsUnions}
)
SELECT 
    s.column_name,
    s.distinct_count,
    s.null_count,
    s.min_value,
    s.max_value,
    sv.sample_values
FROM stats s
LEFT JOIN sample_values sv ON s.column_name = sv.column_name
ORDER BY s.column_name`;
  }

  /**
   * Sanitize column name for use in SQL aliases (replace special characters)
   */
  private sanitizeColumnName(columnName: string): string {
    return columnName
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^(\d)/, '_$1') // Prefix with _ if starts with number
      .toLowerCase();
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

  /**
   * BigQuery-optimized full introspection that takes advantage of caching
   * Fetches data sequentially: databases → schemas → tables → columns → views
   * Each step benefits from the cache populated by previous steps
   */
  override async getFullIntrospection(options?: {
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

    // Step 1: Fetch all databases (populates database cache)
    const allDatabases = await this.getDatabases();

    // Filter databases if specified
    const databases = options?.databases
      ? allDatabases.filter((db) => options.databases?.includes(db.name) ?? false)
      : allDatabases;

    // Step 2: Fetch all schemas (benefits from database cache, populates schema cache)
    const allSchemas = await this.getSchemas(); // No filter - gets all schemas and caches them

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

    // Step 3: Fetch all tables (benefits from database cache, populates table cache)
    const allTables = await this.getTables(); // No filter - gets all tables and caches them

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

    // Step 4: Fetch all columns (benefits from database cache, populates column cache)
    const allColumns = await this.getColumns(); // No filter - gets all columns and caches them

    // Filter columns based on filtered tables
    const columns = allColumns.filter((column) =>
      tables.some(
        (table) =>
          table.name === column.table &&
          table.schema === column.schema &&
          table.database === column.database
      )
    );

    // Step 5: Fetch all views (benefits from database cache, populates view cache)
    const allViews = await this.getViews(); // No filter - gets all views and caches them

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

    // Get column statistics in batches of 20 tables
    const columnsWithStats = await this.attachColumnStatisticsBigQuery(tables, columns);

    // Filter databases to only those that have schemas when schema filter is applied
    let filteredDatabases = databases;
    if (options?.schemas && !options?.databases) {
      const databasesWithFilteredSchemas = new Set(schemas.map((schema) => schema.database));
      filteredDatabases = databases.filter((db) => databasesWithFilteredSchemas.has(db.name));
    }

    return {
      dataSourceName: this.dataSourceName,
      dataSourceType: this.getDataSourceType(),
      databases: filteredDatabases,
      schemas,
      tables,
      columns: columnsWithStats,
      views,
      indexes: [], // BigQuery doesn't expose index information
      foreignKeys: [], // BigQuery doesn't expose foreign key information
      introspectedAt: new Date(),
    };
  }

  /**
   * Attach column statistics to columns by processing tables in batches
   */
  private async attachColumnStatisticsBigQuery(
    tables: Table[],
    columns: Column[]
  ): Promise<Column[]> {
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
                  column.sampleValues = stat.sampleValues ?? '';
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
}
