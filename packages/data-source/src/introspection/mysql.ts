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
 * MySQL-specific introspector implementation
 * Optimized to batch metadata queries and eliminate N+1 patterns
 */
export class MySQLIntrospector extends BaseIntrospector {
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
    return DataSourceType.MySQL;
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
      // Query 1: Get all databases
      const databasesResult = await this.adapter.query('SHOW DATABASES');

      this.metadataCache.databases = databasesResult.rows
        .filter((row) => {
          const name = this.getString(row.Database);
          return (
            name && !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(name)
          );
        })
        .map((row) => ({
          name: this.getString(row.Database) || '',
        }));

      // In MySQL, databases and schemas are the same concept
      this.metadataCache.schemas = this.metadataCache.databases.map((db) => ({
        name: db.name,
        database: db.name,
        owner: db.owner,
        comment: db.comment,
      }));

      // Query 2: Get all tables across all databases
      const tablesResult = await this.adapter.query(`
        SELECT table_schema as database_name,
               table_name as name,
               table_type as type,
               table_comment as comment,
               create_time as created,
               update_time as last_modified
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name
      `);

      this.metadataCache.tables = tablesResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        schema: this.getString(row.database_name) || '',
        database: this.getString(row.database_name) || '',
        type: this.mapTableType(this.getString(row.type)),
        comment: this.getString(row.comment),
        created: this.parseDate(row.created),
        lastModified: this.parseDate(row.last_modified),
      }));

      // Query 3: Get all columns across all databases
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
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name, ordinal_position
      `);

      this.metadataCache.columns = columnsResult.rows.map((row) => ({
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

      // Query 4: Get all views across all databases
      const viewsResult = await this.adapter.query(`
        SELECT table_schema as database_name,
               table_name as name,
               view_definition as definition
        FROM information_schema.views
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name
      `);

      this.metadataCache.views = viewsResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        schema: this.getString(row.database_name) || '',
        database: this.getString(row.database_name) || '',
        definition: this.getString(row.definition) || '',
      }));

      this.metadataCache.lastFetched = new Date();
    } catch (error) {
      console.warn('Failed to fetch MySQL metadata:', error);
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

  async getSchemas(_database?: string): Promise<Schema[]> {
    await this.fetchAllMetadata();
    return this.metadataCache.schemas || [];
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    await this.fetchAllMetadata();
    let tables = this.metadataCache.tables || [];

    const targetDatabase = database || schema;
    if (targetDatabase) {
      tables = tables.filter((table) => table.database === targetDatabase);
    }

    // Enhance tables with basic statistics
    const tablesWithStats = await Promise.all(
      tables.map(async (table) => {
        try {
          // Get basic table statistics
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
          // If stats query fails, return table without stats
          console.warn(`Failed to get stats for table ${table.database}.${table.name}:`, error);
          return table;
        }
      })
    );

    return tablesWithStats;
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    await this.fetchAllMetadata();
    let columns = this.metadataCache.columns || [];

    const targetDatabase = database || schema;

    if (targetDatabase && table) {
      columns = columns.filter((col) => col.database === targetDatabase && col.table === table);
    } else if (targetDatabase) {
      columns = columns.filter((col) => col.database === targetDatabase);
    }

    return columns;
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    await this.fetchAllMetadata();
    let views = this.metadataCache.views || [];

    const targetDatabase = database || schema;
    if (targetDatabase) {
      views = views.filter((view) => view.database === targetDatabase);
    }

    return views;
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
}
