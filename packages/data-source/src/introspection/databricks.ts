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
 * Databricks-specific introspector implementation
 * Uses Spark SQL syntax and Databricks-specific system tables
 * Optimized to batch metadata queries and eliminate N+1 patterns
 */
export class DatabricksIntrospector extends BaseIntrospector {
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
    return DataSourceType.Databricks;
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
          const name = this.getString(row.databaseName || row.namespace);
          return name && !['information_schema', 'default'].includes(name);
        })
        .map((row) => ({
          name: this.getString(row.databaseName || row.namespace) || '',
          comment: this.getString(row.comment),
        }));

      // In Databricks/Spark, databases and schemas are the same concept
      this.metadataCache.schemas = this.metadataCache.databases.map((db) => ({
        name: db.name,
        database: db.name,
        comment: db.comment,
      }));

      // Query 2: Get all tables across all databases
      const accessibleDatabases = this.metadataCache.databases.map((db) => db.name);
      const tablesPromises = accessibleDatabases.map(async (dbName) => {
        try {
          const result = await this.adapter.query(`SHOW TABLES IN ${dbName}`);
          return result.rows.map((row) => ({
            name: this.getString(row.tableName) || '',
            schema: dbName,
            database: dbName,
            type: this.mapTableType(this.getString(row.isTemporary)),
          }));
        } catch (error) {
          console.warn(`Could not access tables in database ${dbName}:`, error);
          return [];
        }
      });

      const tablesResults = await Promise.all(tablesPromises);
      this.metadataCache.tables = tablesResults.flat();

      // Query 3: Get all views across all databases
      const viewsPromises = accessibleDatabases.map(async (dbName) => {
        try {
          const result = await this.adapter.query(`SHOW VIEWS IN ${dbName}`);
          return result.rows.map((row) => ({
            name: this.getString(row.viewName) || '',
            schema: dbName,
            database: dbName,
            definition: '', // Databricks doesn't easily expose view definitions via SHOW VIEWS
          }));
        } catch (error) {
          console.warn(`Could not access views in database ${dbName}:`, error);
          return [];
        }
      });

      const viewsResults = await Promise.all(viewsPromises);
      this.metadataCache.views = viewsResults.flat();

      // Query 4: Get columns for all tables (this is more complex due to DESCRIBE TABLE requirement)
      const columnsPromises = this.metadataCache.tables.map(async (table) => {
        try {
          const result = await this.adapter.query(`DESCRIBE TABLE ${table.database}.${table.name}`);
          return result.rows
            .filter((row) => {
              // Filter out partition info and other metadata
              const colName = this.getString(row.col_name);
              return colName && !colName.startsWith('#') && colName !== '';
            })
            .map((row, index) => ({
              name: this.getString(row.col_name) || '',
              table: table.name,
              schema: table.database,
              database: table.database,
              position: index + 1,
              dataType: this.getString(row.data_type) || '',
              isNullable: !this.getString(row.data_type)?.includes('NOT NULL'),
              comment: this.getString(row.comment),
            }));
        } catch (error) {
          console.warn(`Could not access columns in table ${table.name}:`, error);
          return [];
        }
      });

      const columnsResults = await Promise.all(columnsPromises);
      this.metadataCache.columns = columnsResults.flat();

      this.metadataCache.lastFetched = new Date();
    } catch (error) {
      console.warn('Failed to fetch Databricks metadata:', error);
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

    if (database && schema) {
      tables = tables.filter((table) => table.database === database && table.schema === schema);
    } else if (database) {
      tables = tables.filter((table) => table.database === database);
    } else if (schema) {
      tables = tables.filter((table) => table.schema === schema);
    }

    // Enhance tables with basic statistics
    const tablesWithStats = await Promise.all(
      tables.map(async (table) => {
        try {
          // Get basic table statistics using Databricks system tables
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

    const targetDatabase = database || schema;

    if (targetDatabase && table) {
      columns = columns.filter((col) => col.database === targetDatabase && col.table === table);
    } else if (targetDatabase) {
      columns = columns.filter((col) => col.database === targetDatabase);
    }

    if (table && !targetDatabase) {
      columns = columns.filter((col) => col.table === table);
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
   * Get column statistics using UNION query approach
   */
  private async getColumnStatisticsForColumns(
    database: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    // Build UNION query with one SELECT per column, cast to string for compatibility
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
               SELECT concat_ws(',',
                 collect_list(
                   CASE 
                     WHEN length(sample_val) > 100 
                     THEN concat(substring(sample_val, 1, 100), '...')
                     ELSE sample_val
                   END
                 )
               )
               FROM (
                 SELECT DISTINCT CAST(\`${columnName}\` AS STRING) as sample_val
                 FROM \`${database}\`.\`${table}\`
                 WHERE \`${columnName}\` IS NOT NULL
                 ORDER BY sample_val
                 LIMIT 20
               )
             ) AS sample_values`;

    unionClause += `
      FROM \`${database}\`.\`${table}\``;

    return unionClause;
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
}
