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
 */
export class SnowflakeIntrospector extends BaseIntrospector {
  private adapter: DatabaseAdapter;

  constructor(dataSourceName: string, adapter: DatabaseAdapter) {
    super(dataSourceName);
    this.adapter = adapter;
  }

  getDataSourceType(): string {
    return DataSourceType.Snowflake;
  }

  async getDatabases(): Promise<Database[]> {
    const result = await this.adapter.query('SHOW DATABASES');

    return result.rows.map((row) => ({
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
  }

  async getSchemas(database?: string): Promise<Schema[]> {
    const schemas: Schema[] = [];

    if (database) {
      // Get schemas for specific database
      const result = await this.adapter.query(`
        SELECT SCHEMA_NAME, CATALOG_NAME, SCHEMA_OWNER, COMMENT
        FROM ${database}.INFORMATION_SCHEMA.SCHEMATA
        WHERE SCHEMA_NAME != 'INFORMATION_SCHEMA'
      `);

      schemas.push(
        ...result.rows.map((row) => ({
          name: this.getString(row.SCHEMA_NAME) || '',
          database: this.getString(row.CATALOG_NAME) || database,
          owner: this.getString(row.SCHEMA_OWNER),
          comment: this.getString(row.COMMENT),
        }))
      );
    } else {
      // Get all databases first, then schemas for each
      const databases = await this.getDatabases();

      for (const db of databases) {
        try {
          const dbSchemas = await this.getSchemas(db.name);
          schemas.push(...dbSchemas);
        } catch (error) {
          // Skip databases we can't access
          console.warn(`Could not access schemas in database ${db.name}:`, error);
        }
      }
    }

    return schemas;
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    const tables: Table[] = [];

    if (database) {
      const result = await this.adapter.query(`
        SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, 
               ROW_COUNT, BYTES, COMMENT, CREATED, LAST_ALTERED
        FROM ${database}.INFORMATION_SCHEMA.TABLES
        ${schema ? `WHERE TABLE_SCHEMA = '${schema}'` : ''}
      `);

      tables.push(
        ...result.rows.map((row) => ({
          name: this.getString(row.TABLE_NAME) || '',
          schema: this.getString(row.TABLE_SCHEMA) || '',
          database: this.getString(row.TABLE_CATALOG) || database,
          type: this.mapTableType(this.getString(row.TABLE_TYPE)),
          rowCount: this.parseNumber(row.ROW_COUNT),
          sizeBytes: this.parseNumber(row.BYTES),
          comment: this.getString(row.COMMENT),
          created: this.parseDate(row.CREATED),
          lastModified: this.parseDate(row.LAST_ALTERED),
        }))
      );
    } else {
      // Get all databases first, then tables for each
      const databases = await this.getDatabases();

      for (const db of databases) {
        try {
          const dbTables = await this.getTables(db.name, schema);
          tables.push(...dbTables);
        } catch (error) {
          // Skip databases we can't access
          console.warn(`Could not access tables in database ${db.name}:`, error);
        }
      }
    }

    return tables;
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    const columns: Column[] = [];

    if (database) {
      let whereClause = '';
      if (schema && table) {
        whereClause = `WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${table}'`;
      } else if (schema) {
        whereClause = `WHERE TABLE_SCHEMA = '${schema}'`;
      }

      const result = await this.adapter.query(`
        SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, 
               ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
               CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COMMENT
        FROM ${database}.INFORMATION_SCHEMA.COLUMNS
        ${whereClause}
        ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
      `);

      columns.push(
        ...result.rows.map((row) => ({
          name: this.getString(row.COLUMN_NAME) || '',
          table: this.getString(row.TABLE_NAME) || '',
          schema: this.getString(row.TABLE_SCHEMA) || '',
          database: this.getString(row.TABLE_CATALOG) || database,
          position: this.parseNumber(row.ORDINAL_POSITION) || 0,
          dataType: this.getString(row.DATA_TYPE) || '',
          isNullable: this.getString(row.IS_NULLABLE) === 'YES',
          defaultValue: this.getString(row.COLUMN_DEFAULT),
          maxLength: this.parseNumber(row.CHARACTER_MAXIMUM_LENGTH),
          precision: this.parseNumber(row.NUMERIC_PRECISION),
          scale: this.parseNumber(row.NUMERIC_SCALE),
          comment: this.getString(row.COMMENT),
        }))
      );
    } else {
      // Get all databases first, then columns for each
      const databases = await this.getDatabases();

      for (const db of databases) {
        try {
          const dbColumns = await this.getColumns(db.name, schema, table);
          columns.push(...dbColumns);
        } catch (error) {
          // Skip databases we can't access
          console.warn(`Could not access columns in database ${db.name}:`, error);
        }
      }
    }

    return columns;
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    const views: View[] = [];

    if (database) {
      const result = await this.adapter.query(`
        SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION, COMMENT
        FROM ${database}.INFORMATION_SCHEMA.VIEWS
        ${schema ? `WHERE TABLE_SCHEMA = '${schema}'` : ''}
      `);

      views.push(
        ...result.rows.map((row) => ({
          name: this.getString(row.TABLE_NAME) || '',
          schema: this.getString(row.TABLE_SCHEMA) || '',
          database: this.getString(row.TABLE_CATALOG) || database,
          definition: this.getString(row.VIEW_DEFINITION) || '',
          comment: this.getString(row.COMMENT),
        }))
      );
    } else {
      // Get all databases first, then views for each
      const databases = await this.getDatabases();

      for (const db of databases) {
        try {
          const dbViews = await this.getViews(db.name, schema);
          views.push(...dbViews);
        } catch (error) {
          // Skip databases we can't access
          console.warn(`Could not access views in database ${db.name}:`, error);
        }
      }
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

    // Get column information for statistics
    const columns = await this.getColumns(database, schema, table);

    // Generate column statistics queries dynamically based on column types
    const columnStatistics: ColumnStatistics[] = [];

    for (const column of columns) {
      try {
        let statsQuery = '';

        if (this.isNumericType(column.dataType)) {
          statsQuery = `
            SELECT 
              '${column.name}' as column_name,
              APPROX_COUNT_DISTINCT(${column.name}) as distinct_count,
              COUNT(*) - COUNT(${column.name}) as null_count,
              MIN(${column.name}) as min_value,
              MAX(${column.name}) as max_value,
              AVG(${column.name}) as avg_value
            FROM ${database}.${schema}.${table}
          `;
        } else {
          statsQuery = `
            SELECT 
              '${column.name}' as column_name,
              APPROX_COUNT_DISTINCT(${column.name}) as distinct_count,
              COUNT(*) - COUNT(${column.name}) as null_count,
              NULL as min_value,
              NULL as max_value,
              NULL as avg_value
            FROM ${database}.${schema}.${table}
          `;
        }

        const statsResult = await this.adapter.query(statsQuery);

        if (statsResult.rows.length > 0) {
          const row = statsResult.rows[0];
          if (row) {
            columnStatistics.push({
              columnName: column.name,
              distinctCount: this.parseNumber(row.distinct_count),
              nullCount: this.parseNumber(row.null_count),
              minValue: row.min_value,
              maxValue: row.max_value,
              avgValue: this.parseNumber(row.avg_value),
            });
          }
        }
      } catch (error) {
        // Skip columns that cause errors (e.g., complex types)
        console.warn(`Could not get statistics for column ${column.name}:`, error);
      }
    }

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
