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
 * SQL Server-specific introspector implementation
 * Optimized to batch metadata queries for efficiency
 */
export class SQLServerIntrospector extends BaseIntrospector {
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
    return DataSourceType.SQLServer;
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
      const databasesResult = await this.adapter.query(`
        SELECT name,
               database_id,
               create_date,
               collation_name,
               state_desc,
               is_read_only,
               is_auto_close_on,
               is_auto_shrink_on,
               recovery_model_desc
        FROM sys.databases
        WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
        ORDER BY name
      `);

      const databases = databasesResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        created: this.parseDate(row.create_date) || new Date(),
        metadata: {
          database_id: this.parseNumber(row.database_id),
          collation_name: this.getString(row.collation_name),
          state_desc: this.getString(row.state_desc),
          is_read_only: this.parseBoolean(row.is_read_only),
          is_auto_close_on: this.parseBoolean(row.is_auto_close_on),
          is_auto_shrink_on: this.parseBoolean(row.is_auto_shrink_on),
          recovery_model_desc: this.getString(row.recovery_model_desc),
        },
      }));

      this.cache.databases = { data: databases, lastFetched: new Date() };
      return databases;
    } catch (error) {
      console.warn('Failed to fetch SQL Server databases:', error);
      return [];
    }
  }

  async getSchemas(_database?: string): Promise<Schema[]> {
    // Check if we have valid cached data
    if (this.cache.schemas && this.isCacheValid(this.cache.schemas.lastFetched)) {
      return this.cache.schemas.data;
    }

    try {
      const whereClause = `WHERE s.name NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest', 'db_owner', 'db_accessadmin', 
                             'db_securityadmin', 'db_ddladmin', 'db_backupoperator', 'db_datareader', 
                             'db_datawriter', 'db_denydatareader', 'db_denydatawriter')`;

      const schemasResult = await this.adapter.query(`
        SELECT s.name as schema_name,
               DB_NAME() as database_name,
               p.name as owner_name,
               s.schema_id,
               s.principal_id,
               p.type_desc as owner_type
        FROM sys.schemas s
        LEFT JOIN sys.database_principals p ON s.principal_id = p.principal_id
        ${whereClause}
        ORDER BY s.name
      `);

      const schemas = schemasResult.rows.map((row) => ({
        name: this.getString(row.schema_name) || '',
        database: this.getString(row.database_name) || '',
        owner: this.getString(row.owner_name) || '',
        metadata: {
          schema_id: this.parseNumber(row.schema_id),
          principal_id: this.parseNumber(row.principal_id),
          owner_type: this.getString(row.owner_type),
        },
      }));

      this.cache.schemas = { data: schemas, lastFetched: new Date() };
      return schemas;
    } catch (error) {
      console.warn('Failed to fetch SQL Server schemas:', error);
      return [];
    }
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    // Check if we have valid cached data and no filters
    if (
      !database &&
      !schema &&
      this.cache.tables &&
      this.isCacheValid(this.cache.tables.lastFetched)
    ) {
      return this.cache.tables.data;
    }

    // If we have cached data and filters, use cached data
    if (this.cache.tables && this.isCacheValid(this.cache.tables.lastFetched)) {
      let tables = this.cache.tables.data;

      if (database && schema) {
        tables = tables.filter((table) => table.database === database && table.schema === schema);
      } else if (database) {
        tables = tables.filter((table) => table.database === database);
      } else if (schema) {
        tables = tables.filter((table) => table.schema === schema);
      }

      return tables;
    }

    try {
      let whereClause = '';

      if (database && schema) {
        whereClause = `WHERE DB_NAME() = '${database}' AND s.name = '${schema}'`;
      } else if (schema) {
        whereClause = `WHERE s.name = '${schema}'`;
      }

      const tablesResult = await this.adapter.query(`
        SELECT DB_NAME() as database_name,
               s.name as schema_name,
               t.name as table_name,
               t.type as table_type,
               t.create_date,
               t.modify_date
        FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        ${whereClause}
        ORDER BY s.name, t.name
      `);

      const tables = tablesResult.rows.map((row) => ({
        name: this.getString(row.table_name) || '',
        schema: this.getString(row.schema_name) || '',
        database: this.getString(row.database_name) || '',
        type: this.mapTableType(this.getString(row.table_type)),
        created: this.parseDate(row.create_date) || new Date(),
        lastModified: this.parseDate(row.modify_date) || new Date(),
      }));

      // Enhance tables with basic statistics
      const tablesWithStats = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableStatsResult = await this.adapter.query(`
              SELECT 
                SUM(p.rows) as row_count,
                SUM(a.total_pages) * 8 * 1024 as size_bytes
              FROM sys.tables t
              INNER JOIN sys.partitions p ON t.object_id = p.object_id
              INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
              WHERE t.name = '${table.name}' 
                AND SCHEMA_NAME(t.schema_id) = '${table.schema}'
                AND p.index_id IN (0,1)
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

      // Only cache if we fetched all tables (no filters)
      if (!database && !schema) {
        this.cache.tables = { data: tablesWithStats, lastFetched: new Date() };
      }

      return tablesWithStats;
    } catch (error) {
      console.warn('Failed to fetch SQL Server tables:', error);
      return [];
    }
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    // Check if we have valid cached data and no filters
    if (
      !database &&
      !schema &&
      !table &&
      this.cache.columns &&
      this.isCacheValid(this.cache.columns.lastFetched)
    ) {
      return this.cache.columns.data;
    }

    // If we have cached data and filters, use cached data
    if (this.cache.columns && this.isCacheValid(this.cache.columns.lastFetched)) {
      let columns = this.cache.columns.data;

      if (database && schema && table) {
        columns = columns.filter(
          (col) => col.database === database && col.schema === schema && col.table === table
        );
      } else if (database && schema) {
        columns = columns.filter((col) => col.database === database && col.schema === schema);
      } else if (database) {
        columns = columns.filter((col) => col.database === database);
      } else if (schema) {
        columns = columns.filter((col) => col.schema === schema);
      } else if (table) {
        columns = columns.filter((col) => col.table === table);
      }

      return columns;
    }

    try {
      let whereClause = '';

      if (database && schema && table) {
        whereClause = `WHERE DB_NAME() = '${database}' AND s.name = '${schema}' AND t.name = '${table}'`;
      } else if (schema && table) {
        whereClause = `WHERE s.name = '${schema}' AND t.name = '${table}'`;
      } else if (schema) {
        whereClause = `WHERE s.name = '${schema}'`;
      } else if (table) {
        whereClause = `WHERE t.name = '${table}'`;
      }

      const columnsResult = await this.adapter.query(`
        SELECT DB_NAME() as database_name,
               s.name as schema_name,
               t.name as table_name,
               c.name as column_name,
               c.column_id as position,
               ty.name as data_type,
               c.is_nullable,
               c.max_length,
               c.precision,
               c.scale,
               dc.definition as default_value
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
        ${whereClause}
        ORDER BY s.name, t.name, c.column_id
      `);

      const columns = columnsResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        table: this.getString(row.table) || '',
        schema: this.getString(row.schema) || '',
        database: this.getString(row.database) || '',
        position: this.parseNumber(row.position) || 0,
        dataType: this.getString(row.data_type) || '',
        isNullable: this.getString(row.is_nullable) === 'YES',
        defaultValue: this.getString(row.default_value) || '',
        maxLength: this.parseNumber(row.max_length) ?? 0,
        precision: this.parseNumber(row.precision) ?? 0,
        scale: this.parseNumber(row.scale) ?? 0,
      }));

      // Only cache if we fetched all columns (no filters)
      if (!database && !schema && !table) {
        this.cache.columns = { data: columns, lastFetched: new Date() };
      }

      return columns;
    } catch (error) {
      console.warn('Failed to fetch SQL Server columns:', error);
      return [];
    }
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    // Check if we have valid cached data and no filters
    if (
      !database &&
      !schema &&
      this.cache.views &&
      this.isCacheValid(this.cache.views.lastFetched)
    ) {
      return this.cache.views.data;
    }

    // If we have cached data and filters, use cached data
    if (this.cache.views && this.isCacheValid(this.cache.views.lastFetched)) {
      let views = this.cache.views.data;

      if (database && schema) {
        views = views.filter((view) => view.database === database && view.schema === schema);
      } else if (database) {
        views = views.filter((view) => view.database === database);
      } else if (schema) {
        views = views.filter((view) => view.schema === schema);
      }

      return views;
    }

    try {
      let whereClause = '';

      if (database && schema) {
        whereClause = `WHERE DB_NAME() = '${database}' AND s.name = '${schema}'`;
      } else if (schema) {
        whereClause = `WHERE s.name = '${schema}'`;
      }

      const viewsResult = await this.adapter.query(`
        SELECT DB_NAME() as database_name,
               s.name as schema_name,
               v.name as table_name,
               m.definition as view_definition
        FROM sys.views v
        INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
        INNER JOIN sys.sql_modules m ON v.object_id = m.object_id
        ${whereClause}
        ORDER BY s.name, v.name
      `);

      const views = viewsResult.rows.map((row) => ({
        name: this.getString(row.table_name) || '',
        schema: this.getString(row.schema_name) || '',
        database: this.getString(row.database_name) || '',
        definition: this.getString(row.view_definition) || '',
      }));

      // Only cache if we fetched all views (no filters)
      if (!database && !schema) {
        this.cache.views = { data: views, lastFetched: new Date() };
      }

      return views;
    } catch (error) {
      console.warn('Failed to fetch SQL Server views:', error);
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
      SELECT 
        SUM(p.rows) as row_count,
        SUM(a.total_pages) * 8 * 1024 as size_bytes
      FROM sys.tables t
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
      WHERE t.name = '${table}' 
        AND SCHEMA_NAME(t.schema_id) = '${schema}'
        AND p.index_id IN (0,1)
    `);

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicStats?.row_count) ?? 0,
      sizeBytes: this.parseNumber(basicStats?.size_bytes) ?? 0,
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
    return this.getColumnStatisticsForColumns(database, schema, table, columns);
  }

  /**
   * Get column statistics using optimized CTE approach with single table scan
   */
  private async getColumnStatisticsForColumns(
    _database: string,
    schema: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    try {
      // Build the optimized CTE-based query
      const statsQuery = this.buildOptimizedColumnStatsQuery(schema, table, columns);
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
  private buildOptimizedColumnStatsQuery(schema: string, table: string, columns: Column[]): string {
    const fullyQualifiedTable = `[${schema}].[${table}]`;

    // Build raw_stats CTE with all column statistics in one scan
    const rawStatsSelects = columns
      .map((column) => {
        const columnName = column.name;
        const isNumeric = this.isNumericType(column.dataType);
        const isDate = this.isDateType(column.dataType);

        let selectClause = `
        COUNT(DISTINCT [${columnName}]) AS distinct_count_${this.sanitizeColumnName(columnName)},
        SUM(CASE WHEN [${columnName}] IS NULL THEN 1 ELSE 0 END) AS null_count_${this.sanitizeColumnName(columnName)}`;

        if (isNumeric || isDate) {
          selectClause += `,
        MIN([${columnName}]) AS min_${this.sanitizeColumnName(columnName)},
        MAX([${columnName}]) AS max_${this.sanitizeColumnName(columnName)}`;
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
                   WHEN LEN(sample_val) > 100 
                   THEN LEFT(sample_val, 100) + '...'
                   ELSE sample_val
               END, 
               ','
           ) WITHIN GROUP (ORDER BY sample_val) AS sample_values
    FROM (
        SELECT DISTINCT TOP 20 CAST([${columnName}] AS NVARCHAR(MAX)) AS sample_val
        FROM sample_data
        WHERE [${columnName}] IS NOT NULL
        ORDER BY sample_val
    ) samples`;
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
          minMaxClause = `CAST(rs.min_${sanitizedName} AS NVARCHAR(MAX)) AS min_value,
        CAST(rs.max_${sanitizedName} AS NVARCHAR(MAX)) AS max_value`;
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
    SELECT TOP 1000 * FROM ${fullyQualifiedTable} ORDER BY NEWID()
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
   * Map SQL Server table types to our standard types
   */
  private mapTableType(
    sqlServerType: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (!sqlServerType) return 'TABLE';

    const type = sqlServerType.toUpperCase();
    if (type === 'V') return 'VIEW';
    if (type === 'U') return 'TABLE';
    return 'TABLE';
  }

  /**
   * Check if a data type is numeric for statistics purposes
   */
  private isNumericType(dataType: string): boolean {
    const numericTypes = [
      'bit',
      'tinyint',
      'smallint',
      'int',
      'bigint',
      'decimal',
      'numeric',
      'smallmoney',
      'money',
      'float',
      'real',
    ];

    return numericTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * Check if a data type is date for statistics purposes
   */
  private isDateType(dataType: string): boolean {
    const dateTypes = ['date', 'time', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset'];

    return dateTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * SQL Server-optimized full introspection that takes advantage of caching
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
    const columnsWithStats = await this.attachColumnStatisticsSQLServer(tables, columns);

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
      indexes: [], // SQL Server doesn't expose index information in this implementation
      foreignKeys: [], // SQL Server doesn't expose foreign key information in this implementation
      introspectedAt: new Date(),
    };
  }

  /**
   * Attach column statistics to columns by processing tables in batches
   */
  private async attachColumnStatisticsSQLServer(
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
