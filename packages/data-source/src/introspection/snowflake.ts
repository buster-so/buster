import type { DatabaseAdapter } from '../adapters/base';
import { DataSourceType } from '../types/credentials';
import type {
  ClusteringInfo,
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
 * Snowflake-specific introspector implementation
 * Optimized to batch metadata queries and eliminate N+1 patterns
 */
export class SnowflakeIntrospector extends BaseIntrospector {
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
    return DataSourceType.Snowflake;
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

      this.metadataCache.databases = databasesResult.rows.map((row) => ({
        name: this.getString(row.name) || '',
        owner: this.getString(row.owner),
        comment: this.getString(row.comment),
        created: this.parseDate(row.created_on),
        lastModified: this.parseDate(row.last_altered),
        metadata: {
          retention_time: this.parseNumber(row.retention_time),
          is_default: this.parseBoolean(row.is_default),
          is_current: this.parseBoolean(row.is_current),
          origin: this.getString(row.origin),
        },
      }));

      // Get accessible databases for further queries
      const accessibleDatabases = this.metadataCache.databases.map((db) => db.name);

      // Query 2: Get all schemas across all accessible databases
      const schemasPromises = accessibleDatabases.map(async (dbName) => {
        try {
          const result = await this.adapter.query(`
            SELECT SCHEMA_NAME, CATALOG_NAME, SCHEMA_OWNER, COMMENT
            FROM ${dbName}.INFORMATION_SCHEMA.SCHEMATA
            WHERE SCHEMA_NAME != 'INFORMATION_SCHEMA'
          `);

          return result.rows.map((row) => ({
            name: this.getString(row.SCHEMA_NAME) || '',
            database: this.getString(row.CATALOG_NAME) || dbName,
            owner: this.getString(row.SCHEMA_OWNER),
            comment: this.getString(row.COMMENT),
          }));
        } catch (error) {
          console.warn(`Could not access schemas in database ${dbName}:`, error);
          return [];
        }
      });

      const schemasResults = await Promise.all(schemasPromises);
      this.metadataCache.schemas = schemasResults.flat();

      // Query 3: Get all tables across all accessible databases
      const tablesPromises = accessibleDatabases.map(async (dbName) => {
        try {
          const result = await this.adapter.query(`
            SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, 
                   ROW_COUNT, BYTES, COMMENT, CREATED, LAST_ALTERED
            FROM ${dbName}.INFORMATION_SCHEMA.TABLES
          `);

          return result.rows.map((row) => ({
            name: this.getString(row.TABLE_NAME) || '',
            schema: this.getString(row.TABLE_SCHEMA) || '',
            database: this.getString(row.TABLE_CATALOG) || dbName,
            type: this.mapTableType(this.getString(row.TABLE_TYPE)),
            rowCount: this.parseNumber(row.ROW_COUNT),
            sizeBytes: this.parseNumber(row.BYTES),
            comment: this.getString(row.COMMENT),
            created: this.parseDate(row.CREATED),
            lastModified: this.parseDate(row.LAST_ALTERED),
          }));
        } catch (error) {
          console.warn(`Could not access tables in database ${dbName}:`, error);
          return [];
        }
      });

      const tablesResults = await Promise.all(tablesPromises);
      this.metadataCache.tables = tablesResults.flat();

      // Query 4: Get all columns across all accessible databases
      const columnsPromises = accessibleDatabases.map(async (dbName) => {
        try {
          const result = await this.adapter.query(`
            SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, 
                   ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
                   CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COMMENT
            FROM ${dbName}.INFORMATION_SCHEMA.COLUMNS
            ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
          `);

          return result.rows.map((row) => ({
            name: this.getString(row.COLUMN_NAME) || '',
            table: this.getString(row.TABLE_NAME) || '',
            schema: this.getString(row.TABLE_SCHEMA) || '',
            database: this.getString(row.TABLE_CATALOG) || dbName,
            position: this.parseNumber(row.ORDINAL_POSITION) || 0,
            dataType: this.getString(row.DATA_TYPE) || '',
            isNullable: this.getString(row.IS_NULLABLE) === 'YES',
            defaultValue: this.getString(row.COLUMN_DEFAULT),
            maxLength: this.parseNumber(row.CHARACTER_MAXIMUM_LENGTH),
            precision: this.parseNumber(row.NUMERIC_PRECISION),
            scale: this.parseNumber(row.NUMERIC_SCALE),
            comment: this.getString(row.COMMENT),
          }));
        } catch (error) {
          console.warn(`Could not access columns in database ${dbName}:`, error);
          return [];
        }
      });

      const columnsResults = await Promise.all(columnsPromises);
      this.metadataCache.columns = columnsResults.flat();

      // Query 5: Get all views across all accessible databases
      const viewsPromises = accessibleDatabases.map(async (dbName) => {
        try {
          const result = await this.adapter.query(`
            SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION, COMMENT
            FROM ${dbName}.INFORMATION_SCHEMA.VIEWS
          `);

          return result.rows.map((row) => ({
            name: this.getString(row.TABLE_NAME) || '',
            schema: this.getString(row.TABLE_SCHEMA) || '',
            database: this.getString(row.TABLE_CATALOG) || dbName,
            definition: this.getString(row.VIEW_DEFINITION) || '',
            comment: this.getString(row.COMMENT),
          }));
        } catch (error) {
          console.warn(`Could not access views in database ${dbName}:`, error);
          return [];
        }
      });

      const viewsResults = await Promise.all(viewsPromises);
      this.metadataCache.views = viewsResults.flat();

      this.metadataCache.lastFetched = new Date();
    } catch (error) {
      console.warn('Failed to fetch Snowflake metadata:', error);
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
    } else if (database) {
      tables = tables.filter((table) => table.database === database);
    } else if (schema) {
      tables = tables.filter((table) => table.schema === schema);
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
    } else if (database && schema) {
      columns = columns.filter((col) => col.database === database && col.schema === schema);
    } else if (database) {
      columns = columns.filter((col) => col.database === database);
    } else if (schema) {
      columns = columns.filter((col) => col.schema === schema);
    }

    if (table && !database && !schema) {
      columns = columns.filter((col) => col.table === table);
    }

    return columns;
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    await this.fetchAllMetadata();
    let views = this.metadataCache.views || [];

    if (database && schema) {
      views = views.filter((view) => view.database === database && view.schema === schema);
    } else if (database) {
      views = views.filter((view) => view.database === database);
    } else if (schema) {
      views = views.filter((view) => view.schema === schema);
    }

    return views;
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    // Get basic table info
    const tableInfo = await this.adapter.query(`
      SELECT ROW_COUNT, BYTES
      FROM ${database}.INFORMATION_SCHEMA.TABLES
      WHERE TABLE_CATALOG = '${database}' 
        AND TABLE_SCHEMA = '${schema}' 
        AND TABLE_NAME = '${table}'
    `);

    // Get column statistics
    const columns = await this.getColumns(database, schema, table);
    const columnStatistics = await this.getColumnStatistics(database, schema, table, columns);

    // Try to get clustering information
    let clusteringInfo: ClusteringInfo | undefined;
    try {
      const clusteringResult = await this.adapter.query(`
        SELECT SYSTEM$CLUSTERING_INFORMATION('${database}.${schema}.${table}') as clustering_info
      `);

      if (clusteringResult.rows.length > 0) {
        const clusteringData = clusteringResult.rows[0]?.clustering_info;
        if (clusteringData && typeof clusteringData === 'object') {
          // Parse clustering information from Snowflake's JSON response
          clusteringInfo = this.parseClusteringInfo(clusteringData);
        }
      }
    } catch (error) {
      // Clustering information might not be available for all tables
      console.warn(`Could not get clustering information for table ${table}:`, error);
    }

    const basicInfo = tableInfo.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicInfo?.ROW_COUNT),
      sizeBytes: this.parseNumber(basicInfo?.BYTES),
      columnStatistics,
      clusteringInfo,
      lastUpdated: new Date(),
    };
  }

  /**
   * Map Snowflake table types to our standard types
   */
  private mapTableType(
    snowflakeType: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (!snowflakeType) return 'TABLE';

    const type = snowflakeType.toUpperCase();
    if (type.includes('VIEW')) return 'VIEW';
    if (type.includes('EXTERNAL')) return 'EXTERNAL_TABLE';
    if (type.includes('TEMPORARY')) return 'TEMPORARY_TABLE';
    return 'TABLE';
  }

  /**
   * Get column statistics using UNION query approach
   */
  private async getColumnStatistics(
    database: string,
    schema: string,
    table: string,
    columns: Column[]
  ): Promise<ColumnStatistics[]> {
    const columnStatistics: ColumnStatistics[] = [];

    if (columns.length === 0) return columnStatistics;

    // Build UNION query with one SELECT per column
    const unionClauses = columns.map((column) =>
      this.buildColumnStatsClause(column, database, schema, table)
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
  private buildColumnStatsClause(
    column: Column,
    database: string,
    schema: string,
    table: string
  ): string {
    const columnName = column.name;
    const isNumeric = this.isNumericType(column.dataType);
    const isDate = this.isDateType(column.dataType);

    let unionClause = `
      SELECT '${columnName}' AS column_name,
             COUNT(DISTINCT ${columnName}) AS distinct_count,
             COUNT(*) - COUNT(${columnName}) AS null_count`;

    // Add min/max for numeric and date columns
    if (isNumeric) {
      unionClause += `,
             MIN(${columnName}) AS min_numeric,
             MAX(${columnName}) AS max_numeric,
             NULL AS min_date,
             NULL AS max_date`;
    } else if (isDate) {
      unionClause += `,
             NULL AS min_numeric,
             NULL AS max_numeric,
             MIN(${columnName}) AS min_date,
             MAX(${columnName}) AS max_date`;
    } else {
      unionClause += `,
             NULL AS min_numeric,
             NULL AS max_numeric,
             NULL AS min_date,
             NULL AS max_date`;
    }

    unionClause += `
      FROM ${database}.${schema}.${table}`;

    return unionClause;
  }

  /**
   * Check if a data type is numeric for statistics purposes
   */
  private isNumericType(dataType: string): boolean {
    const numericTypes = [
      'NUMBER',
      'DECIMAL',
      'NUMERIC',
      'INT',
      'INTEGER',
      'BIGINT',
      'SMALLINT',
      'TINYINT',
      'BYTEINT',
      'FLOAT',
      'FLOAT4',
      'FLOAT8',
      'DOUBLE',
      'DOUBLE PRECISION',
      'REAL',
    ];

    return numericTypes.some((type) => dataType.toUpperCase().includes(type));
  }

  /**
   * Check if a data type is date for statistics purposes
   */
  private isDateType(dataType: string): boolean {
    const dateTypes = ['DATE', 'TIMESTAMP', 'TIMESTAMP_LTZ', 'TIMESTAMP_TZ', 'TIME'];

    return dateTypes.some((type) => dataType.toUpperCase().includes(type));
  }

  /**
   * Parse clustering information from Snowflake's SYSTEM$CLUSTERING_INFORMATION result
   */
  private parseClusteringInfo(clusteringData: unknown): ClusteringInfo | undefined {
    try {
      if (typeof clusteringData === 'string') {
        const parsed = JSON.parse(clusteringData);
        return {
          clusteringKeys: parsed.cluster_by_keys || [],
          clusteringDepth: this.parseNumber(parsed.total_cluster_depth),
          clusteringWidth: this.parseNumber(parsed.total_cluster_width),
          metadata: parsed,
        };
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
