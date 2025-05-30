import type { DatabaseAdapter } from '../adapters/base';
import { DataSourceType } from '../types/credentials';
import type {
  Column,
  ColumnStatistics,
  DataSourceIntrospectionResult,
  Database,
  Schema,
  Table,
  TableStatistics,
  View,
} from '../types/introspection';
import { BaseIntrospector } from './base';

/**
 * Databricks-specific introspector implementation
 * Uses Spark SQL syntax and Databricks-specific system tables
 * Optimized to batch metadata queries and eliminate N+1 patterns
 */
export class DatabricksIntrospector extends BaseIntrospector {
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
    return DataSourceType.Databricks;
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
      const databasesResult = await this.adapter.query('SHOW DATABASES');

      const databases = databasesResult.rows
        .filter((row) => {
          const name = this.getString(row.databaseName || row.namespace);
          return name && !['information_schema', 'default'].includes(name);
        })
        .map((row) => ({
          name: this.getString(row.databaseName || row.namespace) || '',
          comment: this.getString(row.comment),
          metadata: {
            location: this.getString(row.locationUri),
          },
        }));

      this.cache.databases = { data: databases, lastFetched: new Date() };
      return databases;
    } catch (error) {
      console.warn('Failed to fetch Databricks databases:', error);
      return [];
    }
  }

  async getSchemas(_database?: string): Promise<Schema[]> {
    // Check if we have valid cached data
    if (this.cache.schemas && this.isCacheValid(this.cache.schemas.lastFetched)) {
      return this.cache.schemas.data;
    }

    try {
      const databases = await this.getDatabases();

      // In Databricks/Spark, databases and schemas are the same concept
      const schemas = databases.map((db) => ({
        name: db.name,
        database: db.name,
        comment: db.comment,
        metadata: db.metadata,
      }));

      this.cache.schemas = { data: schemas, lastFetched: new Date() };
      return schemas;
    } catch (error) {
      console.warn('Failed to fetch Databricks schemas:', error);
      return [];
    }
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    try {
      let tables: Table[] = [];
      const targetDatabase = database || schema;

      if (targetDatabase) {
        // Get tables for specific database
        const result = await this.adapter.query(`SHOW TABLES IN ${targetDatabase}`);
        tables = result.rows.map((row) => ({
          name: this.getString(row.tableName) || '',
          schema: targetDatabase,
          database: targetDatabase,
          type: this.mapTableType(this.getString(row.isTemporary)),
        }));
      } else {
        // Get tables for all accessible databases
        const databases = await this.getDatabases();
        const tablesPromises = databases.map(async (db) => {
          try {
            const result = await this.adapter.query(`SHOW TABLES IN ${db.name}`);
            return result.rows.map((row) => ({
              name: this.getString(row.tableName) || '',
              schema: db.name,
              database: db.name,
              type: this.mapTableType(this.getString(row.isTemporary)),
            }));
          } catch (error) {
            console.warn(`Could not access tables in database ${db.name}:`, error);
            return [];
          }
        });

        const tablesResults = await Promise.all(tablesPromises);
        tables = tablesResults.flat();
      }

      // Enhance tables with basic statistics
      const tablesWithStats = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableStatsResult = await this.adapter.query(`
              DESCRIBE DETAIL ${table.database}.${table.schema}.${table.name}
            `);

            const stats = tableStatsResult.rows[0];
            return {
              ...table,
              rowCount: this.parseNumber(stats?.numRows),
              sizeBytes: this.parseNumber(stats?.sizeInBytes),
            };
          } catch (error) {
            console.warn(`Failed to get stats for table ${table.schema}.${table.name}:`, error);
            return table;
          }
        })
      );

      return tablesWithStats;
    } catch (error) {
      console.warn('Failed to fetch Databricks tables:', error);
      return [];
    }
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    try {
      const targetDatabase = database || schema;

      if (targetDatabase && table) {
        // Get columns for specific table
        const result = await this.adapter.query(`DESCRIBE TABLE ${targetDatabase}.${table}`);
        return result.rows
          .filter((row) => {
            const colName = this.getString(row.col_name);
            return colName && !colName.startsWith('#') && colName !== '';
          })
          .map((row, index) => ({
            name: this.getString(row.col_name) || '',
            table: table,
            schema: targetDatabase,
            database: targetDatabase,
            position: index + 1,
            dataType: this.getString(row.data_type) || '',
            isNullable: !this.getString(row.data_type)?.includes('NOT NULL'),
            comment: this.getString(row.comment),
          }));
      }

      if (targetDatabase) {
        // Get columns for all tables in database
        const tables = await this.getTables(targetDatabase);
        const columnsPromises = tables.map(async (tableInfo) => {
          try {
            const result = await this.adapter.query(
              `DESCRIBE TABLE ${tableInfo.database}.${tableInfo.name}`
            );
            return result.rows
              .filter((row) => {
                const colName = this.getString(row.col_name);
                return colName && !colName.startsWith('#') && colName !== '';
              })
              .map((row, index) => ({
                name: this.getString(row.col_name) || '',
                table: tableInfo.name,
                schema: tableInfo.database,
                database: tableInfo.database,
                position: index + 1,
                dataType: this.getString(row.data_type) || '',
                isNullable: !this.getString(row.data_type)?.includes('NOT NULL'),
                comment: this.getString(row.comment),
              }));
          } catch (error) {
            console.warn(`Could not access columns in table ${tableInfo.name}:`, error);
            return [];
          }
        });

        const columnsResults = await Promise.all(columnsPromises);
        return columnsResults.flat();
      }

      // Get columns for all tables across all databases
      const databases = await this.getDatabases();
      const allColumnsPromises = databases.map(async (db) => {
        return this.getColumns(db.name);
      });

      const allColumnsResults = await Promise.all(allColumnsPromises);
      return allColumnsResults.flat();
    } catch (error) {
      console.warn('Failed to fetch Databricks columns:', error);
      return [];
    }
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    try {
      let views: View[] = [];
      const targetDatabase = database || schema;

      if (targetDatabase) {
        // Get views for specific database
        const result = await this.adapter.query(`SHOW VIEWS IN ${targetDatabase}`);
        views = result.rows.map((row) => ({
          name: this.getString(row.viewName) || '',
          schema: targetDatabase,
          database: targetDatabase,
          definition: '', // Databricks doesn't easily expose view definitions via SHOW VIEWS
        }));
      }

      // Get views for all accessible databases
      const databases = await this.getDatabases();
      const viewsPromises = databases.map(async (db) => {
        try {
          const result = await this.adapter.query(`SHOW VIEWS IN ${db.name}`);
          return result.rows.map((row) => ({
            name: this.getString(row.viewName) || '',
            schema: db.name,
            database: db.name,
            definition: '',
          }));
        } catch (error) {
          console.warn(`Could not access views in database ${db.name}:`, error);
          return [];
        }
      });

      const viewsResults = await Promise.all(viewsPromises);
      views = viewsResults.flat();

      return views;
    } catch (error) {
      console.warn('Failed to fetch Databricks views:', error);
      return [];
    }
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    // Get basic table statistics only (no column statistics)
    const tableStatsResult = await this.adapter.query(`
      DESCRIBE DETAIL ${database}.${schema}.${table}
    `);

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicStats?.numRows),
      sizeBytes: this.parseNumber(basicStats?.sizeInBytes),
      columnStatistics: [], // No column statistics in basic table stats
      lastUpdated: new Date(),
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
    // Get columns for this table
    const columns = await this.getColumns(database, schema, table);
    return this.getColumnStatisticsForColumns(database, table, columns);
  }

  /**
   * Get column statistics using optimized CTE approach with single table scan
   */
  private async getColumnStatisticsForColumns(
    database: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    try {
      // Build the optimized CTE-based query
      const statsQuery = this.buildOptimizedColumnStatsQuery(database, table, columns);
      const statsResult = await this.adapter.query(statsQuery);

      // Parse results - each row represents one column's statistics
      for (const row of statsResult.rows) {
        if (row) {
          columnStatistics.push({
            columnName: this.getString(row.column_name) || '',
            distinctCount: this.parseNumber(row.distinct_count),
            nullCount: this.parseNumber(row.null_count),
            minValue: this.getString(row.min_value),
            maxValue: this.getString(row.max_value),
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
   * Build optimized CTE-based query that scans the table only once
   */
  private buildOptimizedColumnStatsQuery(
    database: string,
    table: string,
    columns: Column[]
  ): string {
    const fullyQualifiedTable = `\`${database}\`.\`${table}\``;

    // Build raw_stats CTE with all column statistics in one scan
    const rawStatsSelects = columns
      .map((column) => {
        const columnName = column.name;
        const isNumeric = this.isNumericType(column.dataType);
        const isDate = this.isDateType(column.dataType);

        let selectClause = `
        COUNT(DISTINCT \`${columnName}\`) AS distinct_count_${this.sanitizeColumnName(columnName)},
        SUM(CASE WHEN \`${columnName}\` IS NULL THEN 1 ELSE 0 END) AS null_count_${this.sanitizeColumnName(columnName)}`;

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
           concat_ws(',',
             collect_list(
               CASE 
                 WHEN length(sample_val) > 100 
                 THEN concat(substring(sample_val, 1, 100), '...')
                 ELSE sample_val
               END
             )
           ) AS sample_values
    FROM (
        SELECT DISTINCT CAST(\`${columnName}\` AS STRING) AS sample_val
        FROM sample_data
        WHERE \`${columnName}\` IS NOT NULL
        ORDER BY sample_val
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
    SELECT * FROM ${fullyQualifiedTable} TABLESAMPLE (100 ROWS)
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
   * Map Databricks table types to our standard types
   */
  private mapTableType(
    isTemporary: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (isTemporary === 'true') return 'TEMPORARY_TABLE';
    return 'TABLE';
  }

  /**
   * Check if a data type is numeric for statistics purposes
   */
  private isNumericType(dataType: string): boolean {
    const numericTypes = [
      'tinyint',
      'smallint',
      'int',
      'integer',
      'bigint',
      'float',
      'double',
      'decimal',
      'numeric',
    ];

    return numericTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * Check if a data type is date for statistics purposes
   */
  private isDateType(dataType: string): boolean {
    const dateTypes = ['date', 'timestamp', 'interval'];

    return dateTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * Databricks-optimized full introspection that takes advantage of caching
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
    const columnsWithStats = await this.attachColumnStatisticsDatabricks(tables, columns);

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
      indexes: undefined, // Databricks doesn't expose index information
      foreignKeys: undefined, // Databricks doesn't expose foreign key information
      introspectedAt: new Date(),
    };
  }

  /**
   * Attach column statistics to columns by processing tables in batches
   */
  private async attachColumnStatisticsDatabricks(
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
}
