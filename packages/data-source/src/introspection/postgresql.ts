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
 * PostgreSQL-specific introspector implementation
 * Optimized to batch metadata queries for efficiency
 */
export class PostgreSQLIntrospector extends BaseIntrospector {
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
    return DataSourceType.PostgreSQL;
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
      const databasesResult = await this.adapter.query(`
        SELECT datname as name, 
               pg_catalog.pg_get_userbyid(datdba) as owner,
               pg_catalog.shobj_description(oid, 'pg_database') as comment
        FROM pg_catalog.pg_database 
        WHERE datistemplate = false
        ORDER BY datname
      `);

      this.metadataCache.databases = databasesResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        owner: this.getString(row.owner),
        comment: this.getString(row.comment),
      }));

      // Query 2: Get all schemas
      const schemasResult = await this.adapter.query(`
        SELECT schema_name as name,
               catalog_name as database,
               schema_owner as owner
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
      `);

      this.metadataCache.schemas = schemasResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        database: this.getString(row.database) || '',
        owner: this.getString(row.owner),
      }));

      // Query 3: Get all tables and views in one query
      const tablesAndViewsResult = await this.adapter.query(`
        SELECT table_catalog as database,
               table_schema as schema,
               table_name as name,
               table_type as type,
               NULL as view_definition
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        
        UNION ALL
        
        SELECT table_catalog as database,
               table_schema as schema,
               table_name as name,
               'VIEW' as type,
               view_definition
        FROM information_schema.views
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        
        ORDER BY schema, name
      `);

      // Separate tables and views
      this.metadataCache.tables = [];
      this.metadataCache.views = [];

      for (const row of tablesAndViewsResult.rows) {
        const tableType = this.getString(row.type);
        const item = {
          name: this.getString(row.name) || '',
          schema: this.getString(row.schema) || '',
          database: this.getString(row.database) || '',
        };

        if (tableType?.toUpperCase().includes('VIEW')) {
          this.metadataCache.views.push({
            ...item,
            definition: this.getString(row.view_definition) || '',
          });
        } else {
          this.metadataCache.tables.push({
            ...item,
            type: this.mapTableType(tableType),
          });
        }
      }

      // Query 4: Get all columns
      const columnsResult = await this.adapter.query(`
        SELECT table_catalog as database,
               table_schema as schema,
               table_name as table,
               column_name as name,
               ordinal_position as position,
               data_type,
               is_nullable,
               column_default as default_value,
               character_maximum_length as max_length,
               numeric_precision as precision,
               numeric_scale as scale
        FROM information_schema.columns
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name, ordinal_position
      `);

      this.metadataCache.columns = columnsResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        table: this.getString(row.table) || '',
        schema: this.getString(row.schema) || '',
        database: this.getString(row.database) || '',
        position: this.parseNumber(row.position) || 0,
        dataType: this.getString(row.data_type) || '',
        isNullable: this.getString(row.is_nullable) === 'YES',
        defaultValue: this.getString(row.default_value),
        maxLength: this.parseNumber(row.max_length),
        precision: this.parseNumber(row.precision),
        scale: this.parseNumber(row.scale),
      }));

      this.metadataCache.lastFetched = new Date();
    } catch (error) {
      console.warn('Failed to fetch PostgreSQL metadata:', error);
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
    } else if (schema) {
      tables = tables.filter((table) => table.schema === schema);
    } else if (database) {
      tables = tables.filter((table) => table.database === database);
    }

    // Enhance tables with basic statistics
    const tablesWithStats = await Promise.all(
      tables.map(async (table) => {
        try {
          // Get basic table statistics
          const tableStatsResult = await this.adapter.query(`
            SELECT 
              schemaname, 
              relname as tablename, 
              n_live_tup as row_count,
              pg_total_relation_size(schemaname||'.'||relname) as size_bytes
            FROM pg_stat_user_tables 
            WHERE schemaname = '${table.schema}' AND relname = '${table.name}'
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
    } else if (schema && table) {
      columns = columns.filter((col) => col.schema === schema && col.table === table);
    } else if (schema) {
      columns = columns.filter((col) => col.schema === schema);
    } else if (database) {
      columns = columns.filter((col) => col.database === database);
    }

    return columns;
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    await this.fetchAllMetadata();
    let views = this.metadataCache.views || [];

    if (database && schema) {
      views = views.filter((view) => view.database === database && view.schema === schema);
    } else if (schema) {
      views = views.filter((view) => view.schema === schema);
    } else if (database) {
      views = views.filter((view) => view.database === database);
    }

    return views;
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    // Get basic table statistics only (no column statistics)
    const tableStatsResult = await this.adapter.query(`
      SELECT schemaname, relname, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
      FROM pg_stat_user_tables 
      WHERE schemaname = '${schema}' AND relname = '${table}'
    `);

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicStats?.n_live_tup),
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
   * Get column statistics using UNION query approach
   */
  private async getColumnStatisticsForColumns(
    _database: string,
    schema: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    // Build UNION query with one SELECT per column
    const unionClauses = columns.map((column) =>
      this.buildColumnStatsClause(column, schema, table)
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
  private buildColumnStatsClause(column: Column, schema: string, table: string): string {
    const columnName = column.name;
    const isNumeric = this.isNumericType(column.dataType);
    const isDate = this.isDateType(column.dataType);

    let unionClause = `
      SELECT '${columnName}' AS column_name,
             COUNT(DISTINCT ${columnName}) AS distinct_count,
             COUNT(*) - COUNT(${columnName}) AS null_count`;

    // Add min/max for numeric and date columns, cast to text for UNION compatibility
    if (isNumeric) {
      unionClause += `,
             MIN(${columnName})::text AS min_value,
             MAX(${columnName})::text AS max_value`;
    } else if (isDate) {
      unionClause += `,
             MIN(${columnName})::text AS min_value,
             MAX(${columnName})::text AS max_value`;
    } else {
      unionClause += `,
             NULL AS min_value,
             NULL AS max_value`;
    }

    // Add sample values - get up to 20 distinct values, truncated and comma-separated
    unionClause += `,
             (
               SELECT string_agg(
                 CASE 
                   WHEN length(sample_val::text) > 100 
                   THEN left(sample_val::text, 100) || '...'
                   ELSE sample_val::text
                 END, 
                 ','
                 ORDER BY sample_val::text
               )
               FROM (
                 SELECT DISTINCT ${columnName} as sample_val
                 FROM ${schema}.${table}
                 WHERE ${columnName} IS NOT NULL
                 LIMIT 20
               ) samples
             ) AS sample_values`;

    unionClause += `
      FROM ${schema}.${table}`;

    return unionClause;
  }

  /**
   * Map PostgreSQL table types to our standard types
   */
  private mapTableType(
    pgType: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (!pgType) return 'TABLE';

    const type = pgType.toUpperCase();
    if (type.includes('VIEW')) return 'VIEW';
    if (type.includes('FOREIGN')) return 'EXTERNAL_TABLE';
    return 'TABLE';
  }

  /**
   * Check if a data type is numeric for statistics purposes
   */
  private isNumericType(dataType: string): boolean {
    const numericTypes = [
      'integer',
      'bigint',
      'smallint',
      'decimal',
      'numeric',
      'real',
      'double precision',
      'serial',
      'bigserial',
      'smallserial',
      'money',
    ];

    return numericTypes.some((type) => dataType.toLowerCase().includes(type));
  }

  /**
   * Check if a data type is date for statistics purposes
   */
  private isDateType(dataType: string): boolean {
    const dateTypes = ['date', 'timestamp', 'timestamptz', 'time', 'timetz'];

    return dateTypes.some((type) => dataType.toLowerCase().includes(type));
  }
}
