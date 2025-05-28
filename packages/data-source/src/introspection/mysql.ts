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
 * MySQL-specific introspector implementation
 * Optimized to batch metadata queries and eliminate N+1 patterns
 */
export class MySQLIntrospector extends BaseIntrospector {
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
    return DataSourceType.MySQL;
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
          const name = this.getString(row.Database);
          return (
            name && !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(name)
          );
        })
        .map((row) => ({
          name: this.getString(row.Database) || '',
        }));

      this.cache.databases = { data: databases, lastFetched: new Date() };
      return databases;
    } catch (error) {
      console.warn('Failed to fetch MySQL databases:', error);
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

      // In MySQL, databases and schemas are the same concept
      const schemas = databases.map((db) => ({
        name: db.name,
        database: db.name,
        owner: db.owner,
        comment: db.comment,
      }));

      this.cache.schemas = { data: schemas, lastFetched: new Date() };
      return schemas;
    } catch (error) {
      console.warn('Failed to fetch MySQL schemas:', error);
      return [];
    }
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    try {
      const targetDatabase = database || schema;
      let whereClause =
        "WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')";

      if (targetDatabase) {
        whereClause += ` AND table_schema = '${targetDatabase}'`;
      }

      const tablesResult = await this.adapter.query(`
        SELECT table_schema as database_name,
               table_name as name,
               table_type as type,
               table_comment as comment,
               create_time as created,
               update_time as last_modified
        FROM information_schema.tables
        ${whereClause}
        ORDER BY table_schema, table_name
      `);

      const tables = tablesResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        schema: this.getString(row.database_name) || '',
        database: this.getString(row.database_name) || '',
        type: this.mapTableType(this.getString(row.type)),
        comment: this.getString(row.comment),
        created: this.parseDate(row.created),
        lastModified: this.parseDate(row.last_modified),
      }));

      // Enhance tables with basic statistics
      const tablesWithStats = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableStatsResult = await this.adapter.query(`
              SELECT table_rows as row_count,
                     data_length + index_length as size_bytes
              FROM information_schema.tables
              WHERE table_schema = '${table.database}' AND table_name = '${table.name}'
            `);

            const stats = tableStatsResult.rows[0];
            return {
              ...table,
              rowCount: this.parseNumber(stats?.row_count),
              sizeBytes: this.parseNumber(stats?.size_bytes),
            };
          } catch (error) {
            console.warn(`Failed to get stats for table ${table.database}.${table.name}:`, error);
            return table;
          }
        })
      );

      return tablesWithStats;
    } catch (error) {
      console.warn('Failed to fetch MySQL tables:', error);
      return [];
    }
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    try {
      const targetDatabase = database || schema;
      let whereClause =
        "WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')";

      if (targetDatabase && table) {
        whereClause += ` AND table_schema = '${targetDatabase}' AND table_name = '${table}'`;
      } else if (targetDatabase) {
        whereClause += ` AND table_schema = '${targetDatabase}'`;
      } else if (table) {
        whereClause += ` AND table_name = '${table}'`;
      }

      const columnsResult = await this.adapter.query(`
        SELECT table_schema as database_name,
               table_name as table_name,
               column_name as name,
               ordinal_position as position,
               data_type,
               is_nullable,
               column_default as default_value,
               character_maximum_length as max_length,
               numeric_precision as precision,
               numeric_scale as scale,
               column_comment as comment
        FROM information_schema.columns
        ${whereClause}
        ORDER BY table_schema, table_name, ordinal_position
      `);

      return columnsResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        table: this.getString(row.table_name) || '',
        schema: this.getString(row.database_name) || '',
        database: this.getString(row.database_name) || '',
        position: this.parseNumber(row.position) || 0,
        dataType: this.getString(row.data_type) || '',
        isNullable: this.getString(row.is_nullable) === 'YES',
        defaultValue: this.getString(row.default_value),
        maxLength: this.parseNumber(row.max_length),
        precision: this.parseNumber(row.precision),
        scale: this.parseNumber(row.scale),
        comment: this.getString(row.comment),
      }));
    } catch (error) {
      console.warn('Failed to fetch MySQL columns:', error);
      return [];
    }
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    try {
      const targetDatabase = database || schema;
      let whereClause =
        "WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')";

      if (targetDatabase) {
        whereClause += ` AND table_schema = '${targetDatabase}'`;
      }

      const viewsResult = await this.adapter.query(`
        SELECT table_schema as database_name,
               table_name as name,
               view_definition as definition
        FROM information_schema.views
        ${whereClause}
        ORDER BY table_schema, table_name
      `);

      return viewsResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        schema: this.getString(row.database_name) || '',
        database: this.getString(row.database_name) || '',
        definition: this.getString(row.definition) || '',
      }));
    } catch (error) {
      console.warn('Failed to fetch MySQL views:', error);
      return [];
    }
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    const targetDatabase = database || schema;

    // Get basic table statistics only (no column statistics)
    const tableStatsResult = await this.adapter.query(`
      SELECT table_rows as row_count,
             data_length + index_length as size_bytes
      FROM information_schema.tables
      WHERE table_schema = '${targetDatabase}' AND table_name = '${table}'
    `);

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema: targetDatabase,
      database: targetDatabase,
      rowCount: this.parseNumber(basicStats?.row_count),
      sizeBytes: this.parseNumber(basicStats?.size_bytes),
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
    const targetDatabase = database || schema;
    // Get columns for this table
    const columns = await this.getColumns(targetDatabase, undefined, table);
    return this.getColumnStatisticsForColumns(targetDatabase, table, columns);
  }

  /**
   * Get column statistics using UNION query approach
   */
  private async getColumnStatisticsForColumns(
    database: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    // Build UNION query with one SELECT per column, cast to text for compatibility
    const unionClauses = columns.map((column) =>
      this.buildColumnStatsClause(column, database, table)
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
  private buildColumnStatsClause(column: Column, database: string, table: string): string {
    const columnName = column.name;
    const isNumeric = this.isNumericType(column.dataType);
    const isDate = this.isDateType(column.dataType);

    let unionClause = `
      SELECT '${columnName}' AS column_name,
             COUNT(DISTINCT \`${columnName}\`) AS distinct_count,
             COUNT(*) - COUNT(\`${columnName}\`) AS null_count`;

    // Add min/max for numeric and date columns, cast to text for UNION compatibility
    if (isNumeric) {
      unionClause += `,
             CAST(MIN(\`${columnName}\`) AS CHAR) AS min_value,
             CAST(MAX(\`${columnName}\`) AS CHAR) AS max_value`;
    } else if (isDate) {
      unionClause += `,
             CAST(MIN(\`${columnName}\`) AS CHAR) AS min_value,
             CAST(MAX(\`${columnName}\`) AS CHAR) AS max_value`;
    } else {
      unionClause += `,
             NULL AS min_value,
             NULL AS max_value`;
    }

    // Add sample values - get up to 20 distinct values, truncated and comma-separated
    unionClause += `,
             (
               SELECT GROUP_CONCAT(
                 CASE 
                   WHEN CHAR_LENGTH(sample_val) > 100 
                   THEN CONCAT(LEFT(sample_val, 100), '...')
                   ELSE sample_val
                 END
                 ORDER BY sample_val
                 SEPARATOR ','
               )
               FROM (
                 SELECT DISTINCT CAST(\`${columnName}\` AS CHAR) as sample_val
                 FROM \`${database}\`.\`${table}\`
                 WHERE \`${columnName}\` IS NOT NULL
                 LIMIT 20
               ) samples
             ) AS sample_values`;

    unionClause += `
      FROM \`${database}\`.\`${table}\``;

    return unionClause;
  }

  /**
   * Map MySQL table types to our standard types
   */
  private mapTableType(
    mysqlType: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (!mysqlType) return 'TABLE';

    const type = mysqlType.toUpperCase();
    if (type.includes('VIEW')) return 'VIEW';
    return 'TABLE';
  }

  /**
   * Check if a data type is numeric for statistics purposes
   */
  private isNumericType(dataType: string): boolean {
    const numericTypes = [
      'tinyint',
      'smallint',
      'mediumint',
      'int',
      'integer',
      'bigint',
      'decimal',
      'dec',
      'numeric',
      'fixed',
      'float',
      'double',
      'real',
      'bit',
    ];

    return numericTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * Check if a data type is date for statistics purposes
   */
  private isDateType(dataType: string): boolean {
    const dateTypes = ['date', 'datetime', 'timestamp', 'time', 'year'];

    return dateTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * MySQL-optimized full introspection that takes advantage of caching
   * Fetches data sequentially: databases → schemas → tables → columns → views
   * Each step benefits from the cache populated by previous steps
   */
  override async getFullIntrospection(options?: {
    databases?: string[];
    schemas?: string[];
    tables?: string[];
  }): Promise<DataSourceIntrospectionResult> {
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
    const columnsWithStats = await this.attachColumnStatisticsMySQL(tables, columns);

    return {
      dataSourceName: this.dataSourceName,
      dataSourceType: this.getDataSourceType(),
      databases,
      schemas,
      tables,
      columns: columnsWithStats,
      views,
      indexes: undefined, // MySQL doesn't expose index information in this implementation
      foreignKeys: undefined, // MySQL doesn't expose foreign key information in this implementation
      introspectedAt: new Date(),
    };
  }

  /**
   * Attach column statistics to columns by processing tables in batches
   */
  private async attachColumnStatisticsMySQL(tables: Table[], columns: Column[]): Promise<Column[]> {
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
