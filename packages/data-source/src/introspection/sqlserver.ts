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
 * SQL Server-specific introspector implementation
 * Optimized to batch metadata queries for efficiency
 */
export class SQLServerIntrospector extends BaseIntrospector {
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
    return DataSourceType.SQLServer;
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
        SELECT name,
               database_id,
               create_date,
               collation_name
        FROM sys.databases
        WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
        ORDER BY name
      `);

      this.metadataCache.databases = databasesResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        created: this.parseDate(row.create_date),
        metadata: {
          database_id: this.parseNumber(row.database_id),
          collation_name: this.getString(row.collation_name),
        },
      }));

      // Query 2: Get all schemas
      const schemasResult = await this.adapter.query(`
        SELECT s.name as schema_name,
               DB_NAME() as database_name,
               p.name as owner_name
        FROM sys.schemas s
        LEFT JOIN sys.database_principals p ON s.principal_id = p.principal_id
        WHERE s.name NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest', 'db_owner', 'db_accessadmin', 
                             'db_securityadmin', 'db_ddladmin', 'db_backupoperator', 'db_datareader', 
                             'db_datawriter', 'db_denydatareader', 'db_denydatawriter')
        ORDER BY s.name
      `);

      this.metadataCache.schemas = schemasResult.rows.map((row) => ({
        name: this.getString(row.schema_name) || '',
        database: this.getString(row.database_name) || '',
        owner: this.getString(row.owner_name),
      }));

      // Query 3: Get all tables and views in one query
      const tablesAndViewsResult = await this.adapter.query(`
        SELECT DB_NAME() as database_name,
               s.name as schema_name,
               t.name as table_name,
               t.type as table_type,
               t.create_date,
               t.modify_date,
               NULL as view_definition
        FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE t.type = 'U'
        
        UNION ALL
        
        SELECT DB_NAME() as database_name,
               s.name as schema_name,
               v.name as table_name,
               'V' as table_type,
               v.create_date,
               v.modify_date,
               m.definition as view_definition
        FROM sys.views v
        INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
        INNER JOIN sys.sql_modules m ON v.object_id = m.object_id
        
        ORDER BY schema_name, table_name
      `);

      // Separate tables and views
      this.metadataCache.tables = [];
      this.metadataCache.views = [];

      for (const row of tablesAndViewsResult.rows) {
        const tableType = this.getString(row.table_type);
        const item = {
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.schema_name) || '',
          database: this.getString(row.database_name) || '',
          created: this.parseDate(row.create_date),
          lastModified: this.parseDate(row.modify_date),
        };

        if (tableType === 'V') {
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
        ORDER BY s.name, t.name, c.column_id
      `);

      this.metadataCache.columns = columnsResult.rows.map((row) => ({
        name: this.getString(row.column_name) || '',
        table: this.getString(row.table_name) || '',
        schema: this.getString(row.schema_name) || '',
        database: this.getString(row.database_name) || '',
        position: this.parseNumber(row.position) || 0,
        dataType: this.getString(row.data_type) || '',
        isNullable: this.parseBoolean(row.is_nullable),
        defaultValue: this.getString(row.default_value),
        maxLength: this.parseNumber(row.max_length),
        precision: this.parseNumber(row.precision),
        scale: this.parseNumber(row.scale),
      }));

      this.metadataCache.lastFetched = new Date();
    } catch (error) {
      console.warn('Failed to fetch SQL Server metadata:', error);
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

    return tables;
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
    // Get basic table statistics using SQL Server system views
    const tableStatsResult = await this.adapter.query(`
      SELECT SUM(p.rows) as row_count,
             SUM(a.total_pages) * 8 as size_bytes
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
      WHERE s.name = '${schema}' AND t.name = '${table}'
        AND p.index_id IN (0,1)
    `);

    // Get column statistics
    const columns = await this.getColumns(database, schema, table);
    const columnStatistics = await this.getColumnStatistics(database, schema, table, columns);

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicStats?.row_count),
      sizeBytes: this.parseNumber(basicStats?.size_bytes),
      columnStatistics,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get column statistics using UNION query approach
   */
  private async getColumnStatistics(
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
            minValue: row.min_numeric || row.min_date,
            maxValue: row.max_numeric || row.max_date,
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
             COUNT(DISTINCT [${columnName}]) AS distinct_count,
             COUNT(*) - COUNT([${columnName}]) AS null_count`;

    // Add min/max for numeric and date columns
    if (isNumeric) {
      unionClause += `,
             MIN([${columnName}]) AS min_numeric,
             MAX([${columnName}]) AS max_numeric,
             NULL AS min_date,
             NULL AS max_date`;
    } else if (isDate) {
      unionClause += `,
             NULL AS min_numeric,
             NULL AS max_numeric,
             MIN([${columnName}]) AS min_date,
             MAX([${columnName}]) AS max_date`;
    } else {
      unionClause += `,
             NULL AS min_numeric,
             NULL AS max_numeric,
             NULL AS min_date,
             NULL AS max_date`;
    }

    unionClause += `
      FROM [${schema}].[${table}]`;

    return unionClause;
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
}
