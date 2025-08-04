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
  ValueDistribution,
  View,
} from '../types/introspection';
import { BaseIntrospector } from './base';

/**
 * Snowflake-specific introspector implementation
 * Optimized to batch metadata queries and eliminate N+1 patterns
 */
export class SnowflakeIntrospector extends BaseIntrospector {
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
    return DataSourceType.Snowflake;
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
      const result = await this.adapter.query('SHOW DATABASES');
      const databases = result.rows.map((row) => ({
        name: this.getString(row.name) || '',
        owner: this.getString(row.owner) || '',
        comment: this.getString(row.comment) || '',
        created: this.parseDate(row.created_on) || new Date(),
        lastModified: this.parseDate(row.last_altered) || new Date(),
        metadata: {
          retention_time: this.parseNumber(row.retention_time),
          is_default: this.parseBoolean(row.is_default),
          is_current: this.parseBoolean(row.is_current),
          origin: this.getString(row.origin),
        },
      }));

      this.cache.databases = { data: databases, lastFetched: new Date() };
      return databases;
    } catch (error) {
      console.warn('Failed to fetch databases:', error);
      return [];
    }
  }

  async getSchemas(database?: string): Promise<Schema[]> {
    // Check if we have valid cached data
    if (this.cache.schemas && this.isCacheValid(this.cache.schemas.lastFetched)) {
      const schemas = this.cache.schemas.data;
      return database ? schemas.filter((schema) => schema.database === database) : schemas;
    }

    try {
      let schemas: Schema[] = [];

      if (database) {
        // Fetch schemas for specific database
        const result = await this.adapter.query(`
          SELECT SCHEMA_NAME, CATALOG_NAME, SCHEMA_OWNER, COMMENT, CREATED, LAST_ALTERED
          FROM ${database}.INFORMATION_SCHEMA.SCHEMATA
          WHERE SCHEMA_NAME != 'INFORMATION_SCHEMA'
        `);

        schemas = result.rows.map((row) => ({
          name: this.getString(row.schema_name) || '',
          database: this.getString(row.catalog_name) || database,
          owner: this.getString(row.schema_owner) || '',
          comment: this.getString(row.comment) || '',
          created: this.parseDate(row.created) || new Date(),
          lastModified: this.parseDate(row.last_altered) || new Date(),
        }));
      } else {
        // Fetch schemas for all accessible databases
        const databases = await this.getDatabases();
        const schemasPromises = databases.map(async (db) => {
          try {
            const result = await this.adapter.query(`
              SELECT SCHEMA_NAME, CATALOG_NAME, SCHEMA_OWNER, COMMENT, CREATED, LAST_ALTERED
              FROM ${db.name}.INFORMATION_SCHEMA.SCHEMATA
              WHERE SCHEMA_NAME != 'INFORMATION_SCHEMA'
            `);

            return result.rows.map((row) => ({
              name: this.getString(row.schema_name) || '',
              database: this.getString(row.catalog_name) || db.name,
              owner: this.getString(row.schema_owner) || '',
              comment: this.getString(row.comment) || '',
              created: this.parseDate(row.created) || new Date(),
              lastModified: this.parseDate(row.last_altered) || new Date(),
            }));
          } catch (error) {
            console.warn(`Could not access schemas in database ${db.name}:`, error);
            return [];
          }
        });

        const schemasResults = await Promise.all(schemasPromises);
        schemas = schemasResults.flat();
      }

      // Only cache if we fetched all schemas (no database filter)
      if (!database) {
        this.cache.schemas = { data: schemas, lastFetched: new Date() };
      }

      return schemas;
    } catch (error) {
      console.warn('Failed to fetch schemas:', error);
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
      let tables: Table[] = [];

      if (database && schema) {
        // Fetch tables for specific database and schema
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, 
                 ROW_COUNT, BYTES, COMMENT, CREATED, LAST_ALTERED
          FROM ${database}.INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = '${schema}'
        `);

        tables = result.rows.map((row) => ({
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          type: this.mapTableType(this.getString(row.table_type)),
          rowCount: this.parseNumber(row.row_count) ?? 0,
          sizeBytes: this.parseNumber(row.bytes) ?? 0,
          comment: this.getString(row.comment) || '',
          created: this.parseDate(row.created) || new Date(),
          lastModified: this.parseDate(row.last_altered) || new Date(),
        }));
      } else if (database) {
        // Fetch tables for specific database
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, 
                 ROW_COUNT, BYTES, COMMENT, CREATED, LAST_ALTERED
          FROM ${database}.INFORMATION_SCHEMA.TABLES
        `);

        tables = result.rows.map((row) => ({
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          type: this.mapTableType(this.getString(row.table_type)),
          rowCount: this.parseNumber(row.row_count) ?? 0,
          sizeBytes: this.parseNumber(row.bytes) ?? 0,
          comment: this.getString(row.comment) || '',
          created: this.parseDate(row.created) || new Date(),
          lastModified: this.parseDate(row.last_altered) || new Date(),
        }));
      } else {
        // Fetch tables for all accessible databases
        const databases = await this.getDatabases();
        const tablesPromises = databases.map(async (db) => {
          try {
            const result = await this.adapter.query(`
              SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, 
                     ROW_COUNT, BYTES, COMMENT, CREATED, LAST_ALTERED
              FROM ${db.name}.INFORMATION_SCHEMA.TABLES
            `);

            return result.rows.map((row) => ({
              name: this.getString(row.table_name) || '',
              schema: this.getString(row.table_schema) || '',
              database: this.getString(row.table_catalog) || db.name,
              type: this.mapTableType(this.getString(row.table_type)),
              rowCount: this.parseNumber(row.row_count) ?? 0,
              sizeBytes: this.parseNumber(row.bytes) ?? 0,
              comment: this.getString(row.comment) || '',
              created: this.parseDate(row.created) || new Date(),
              lastModified: this.parseDate(row.last_altered) || new Date(),
            }));
          } catch (error) {
            console.warn(`Could not access tables in database ${db.name}:`, error);
            return [];
          }
        });

        const tablesResults = await Promise.all(tablesPromises);
        tables = tablesResults.flat();
      }

      // Only cache if we fetched all tables (no filters)
      if (!database && !schema) {
        this.cache.tables = { data: tables, lastFetched: new Date() };
      }

      return tables;
    } catch (error) {
      console.warn('Failed to fetch tables:', error);
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
      let columns: Column[] = [];

      if (database && schema && table) {
        // Fetch columns for specific table
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, 
                 ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
                 CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COMMENT
          FROM ${database}.INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${table}'
          ORDER BY ORDINAL_POSITION
        `);

        columns = result.rows.map((row) => ({
          name: this.getString(row.column_name) || '',
          table: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          position: this.parseNumber(row.ordinal_position) || 0,
          dataType: this.getString(row.data_type) || '',
          isNullable: this.getString(row.is_nullable) === 'YES',
          defaultValue: this.getString(row.column_default) || '',
          maxLength: this.parseNumber(row.character_maximum_length) ?? 0,
          precision: this.parseNumber(row.numeric_precision) ?? 0,
          scale: this.parseNumber(row.numeric_scale) ?? 0,
          comment: this.getString(row.comment) || '',
        }));
      } else if (database && schema) {
        // Fetch columns for specific schema
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, 
                 ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
                 CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COMMENT
          FROM ${database}.INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${schema}'
          ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);

        columns = result.rows.map((row) => ({
          name: this.getString(row.column_name) || '',
          table: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          position: this.parseNumber(row.ordinal_position) || 0,
          dataType: this.getString(row.data_type) || '',
          isNullable: this.getString(row.is_nullable) === 'YES',
          defaultValue: this.getString(row.column_default) || '',
          maxLength: this.parseNumber(row.character_maximum_length) ?? 0,
          precision: this.parseNumber(row.numeric_precision) ?? 0,
          scale: this.parseNumber(row.numeric_scale) ?? 0,
          comment: this.getString(row.comment) || '',
        }));
      } else if (database) {
        // Fetch columns for specific database
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, 
                 ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
                 CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COMMENT
          FROM ${database}.INFORMATION_SCHEMA.COLUMNS
          ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
        `);

        columns = result.rows.map((row) => ({
          name: this.getString(row.column_name) || '',
          table: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          position: this.parseNumber(row.ordinal_position) || 0,
          dataType: this.getString(row.data_type) || '',
          isNullable: this.getString(row.is_nullable) === 'YES',
          defaultValue: this.getString(row.column_default) || '',
          maxLength: this.parseNumber(row.character_maximum_length) ?? 0,
          precision: this.parseNumber(row.numeric_precision) ?? 0,
          scale: this.parseNumber(row.numeric_scale) ?? 0,
          comment: this.getString(row.comment) || '',
        }));
      } else {
        // Fetch columns for all accessible databases
        const databases = await this.getDatabases();
        const columnsPromises = databases.map(async (db) => {
          try {
            const result = await this.adapter.query(`
              SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, 
                     ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
                     CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COMMENT
              FROM ${db.name}.INFORMATION_SCHEMA.COLUMNS
              ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
            `);

            return result.rows.map((row) => ({
              name: this.getString(row.column_name) || '',
              table: this.getString(row.table_name) || '',
              schema: this.getString(row.table_schema) || '',
              database: this.getString(row.table_catalog) || db.name,
              position: this.parseNumber(row.ordinal_position) || 0,
              dataType: this.getString(row.data_type) || '',
              isNullable: this.getString(row.is_nullable) === 'YES',
              defaultValue: this.getString(row.column_default) || '',
              maxLength: this.parseNumber(row.character_maximum_length) ?? 0,
              precision: this.parseNumber(row.numeric_precision) ?? 0,
              scale: this.parseNumber(row.numeric_scale) ?? 0,
              comment: this.getString(row.comment) || '',
            }));
          } catch (error) {
            console.warn(`Could not access columns in database ${db.name}:`, error);
            return [];
          }
        });

        const columnsResults = await Promise.all(columnsPromises);
        columns = columnsResults.flat();
      }

      // Only cache if we fetched all columns (no filters)
      if (!database && !schema && !table) {
        this.cache.columns = { data: columns, lastFetched: new Date() };
      }

      return columns;
    } catch (error) {
      console.warn('Failed to fetch columns:', error);
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
      let views: View[] = [];

      if (database && schema) {
        // Fetch views for specific database and schema
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION, COMMENT
          FROM ${database}.INFORMATION_SCHEMA.VIEWS
          WHERE TABLE_SCHEMA = '${schema}'
        `);

        views = result.rows.map((row) => ({
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          definition: this.getString(row.view_definition) || '',
          comment: this.getString(row.comment) || '',
        }));
      } else if (database) {
        // Fetch views for specific database
        const result = await this.adapter.query(`
          SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION, COMMENT
          FROM ${database}.INFORMATION_SCHEMA.VIEWS
        `);

        views = result.rows.map((row) => ({
          name: this.getString(row.table_name) || '',
          schema: this.getString(row.table_schema) || '',
          database: this.getString(row.table_catalog) || database,
          definition: this.getString(row.view_definition) || '',
          comment: this.getString(row.comment) || '',
        }));
      } else {
        // Fetch views for all accessible databases
        const databases = await this.getDatabases();
        const viewsPromises = databases.map(async (db) => {
          try {
            const result = await this.adapter.query(`
              SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION, COMMENT
              FROM ${db.name}.INFORMATION_SCHEMA.VIEWS
            `);

            return result.rows.map((row) => ({
              name: this.getString(row.table_name) || '',
              schema: this.getString(row.table_schema) || '',
              database: this.getString(row.table_catalog) || db.name,
              definition: this.getString(row.view_definition) || '',
              comment: this.getString(row.comment) || '',
            }));
          } catch (error) {
            console.warn(`Could not access views in database ${db.name}:`, error);
            return [];
          }
        });

        const viewsResults = await Promise.all(viewsPromises);
        views = viewsResults.flat();
      }

      // Only cache if we fetched all views (no filters)
      if (!database && !schema) {
        this.cache.views = { data: views, lastFetched: new Date() };
      }

      return views;
    } catch (error) {
      console.warn('Failed to fetch views:', error);
      return [];
    }
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    // Get basic table statistics only (no column statistics)
    const tableInfo = await this.adapter.query(`
      SELECT ROW_COUNT, BYTES
      FROM ${database}.INFORMATION_SCHEMA.TABLES
      WHERE TABLE_CATALOG = '${database}' 
        AND TABLE_SCHEMA = '${schema}' 
        AND TABLE_NAME = '${table}'
    `);

    const basicInfo = tableInfo.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicInfo?.row_count) ?? 0,
      sizeBytes: this.parseNumber(basicInfo?.bytes) ?? 0,
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
    table: string,
    tableRowCount?: number
  ): Promise<ColumnStatistics[]> {
    // Get columns for this table
    const columns = await this.getColumns(database, schema, table);
    return this.getColumnStatisticsForColumns(database, schema, table, columns, tableRowCount);
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
   * Get column statistics using optimized approach with conditional sampling
   * Uses full table scan for tables < 1M rows, sampling for larger tables
   */
  private async getColumnStatisticsForColumns(
    database: string,
    schema: string,
    table: string,
    columns: Column[],
    tableRowCount?: number
  ): Promise<ColumnStatistics[]> {
    if (columns.length === 0) return [];

    try {
      // Build the optimized CTE-based query that gets all statistics in one scan
      const statsQuery = this.buildOptimizedColumnStatsQuery(
        database,
        schema,
        table,
        columns,
        tableRowCount
      );
      const statsResult = await this.adapter.query(statsQuery, undefined, undefined, 300000); // 5 minutes

      // Parse results - each row represents one column's statistics
      const columnStatistics: ColumnStatistics[] = [];

      for (const row of statsResult.rows) {
        if (row) {
          const totalRows = this.parseNumber(row.total_rows) ?? 0;
          const nullCount = this.parseNumber(row.null_count) ?? 0;
          const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

          const stats: ColumnStatistics = {
            columnName: this.getString(row.column_name) || '',
            distinctCount: this.parseNumber(row.distinct_count) ?? 0,
            nullPercentage: nullPercentage,
            minValue: this.getString(row.min_value) ?? '',
            maxValue: this.getString(row.max_value) ?? '',
            sampleValues: this.getString(row.sample_values) ?? '',
            isSampled: row.is_sampled === true,
          };

          // Parse TOP_K distribution if present
          if (row.topk_values) {
            const topK = this.parseTopKAsDistribution(row.topk_values, totalRows);
            if (topK) {
              stats.topKDistribution = topK;
            }
          }

          columnStatistics.push(stats);
        }
      }

      return columnStatistics;
    } catch (error) {
      console.warn(`Failed to get statistics for table ${database}.${schema}.${table}:`, error);

      // Return empty statistics for each column on error
      return columns.map((column) => ({
        columnName: column.name,
        distinctCount: 0,
        nullPercentage: 0,
        minValue: '',
        maxValue: '',
        sampleValues: '',
      }));
    }
  }

  /**
   * Build optimized query with conditional sampling based on table size
   * Uses full scan for tables < 1M rows, sampling for larger tables
   */
  private buildOptimizedColumnStatsQuery(
    database: string,
    schema: string,
    table: string,
    columns: Column[],
    tableRowCount?: number
  ): string {
    const fullyQualifiedTable = `${database}.${schema}.${table}`;
    const SAMPLING_THRESHOLD = 1_000_000;

    // Determine if we should use sampling
    // Sample if: row count is unknown OR row count exceeds threshold
    const shouldSample = tableRowCount === undefined || tableRowCount > SAMPLING_THRESHOLD;

    // Calculate sample percentage
    let sampleClause = '';
    if (shouldSample) {
      let samplePercent: number;
      if (tableRowCount === undefined) {
        // When row count is unknown, default to 10% sample to target ~100k rows
        samplePercent = 10;
      } else {
        // Calculate percentage to get ~1M rows, but at least 0.1%
        samplePercent = Math.max(0.1, (SAMPLING_THRESHOLD / tableRowCount) * 100);
      }
      sampleClause = ` SAMPLE BLOCK (${samplePercent.toFixed(2)})`;
    }

    // Build raw_stats CTE with conditional sampling and appropriate aggregation functions
    const rawStatsSelects = columns
      .map((column) => {
        const columnName = column.name;
        const sanitizedName = this.sanitizeColumnName(columnName);
        const isNumeric = this.isNumericType(column.dataType);
        const isDate = this.isDateType(column.dataType);

        // Use APPROX_COUNT_DISTINCT for better performance in all cases
        // Use appropriate null counting function based on sampling
        const nullFunc = shouldSample ? 'COUNT_IF' : 'SUM(CASE WHEN';

        let selectClause: string;
        if (shouldSample) {
          selectClause = `
        APPROX_COUNT_DISTINCT(${columnName}) AS distinct_count_${sanitizedName},
        COUNT(*) AS total_rows_${sanitizedName},
        ${nullFunc}(${columnName} IS NULL) AS null_count_${sanitizedName}`;
        } else {
          selectClause = `
        APPROX_COUNT_DISTINCT(${columnName}) AS distinct_count_${sanitizedName},
        COUNT(*) AS total_rows_${sanitizedName},
        ${nullFunc} ${columnName} IS NULL THEN 1 ELSE 0 END) AS null_count_${sanitizedName}`;
        }

        if (isNumeric || isDate) {
          selectClause += `,
        MIN(${columnName}) AS min_${sanitizedName},
        MAX(${columnName}) AS max_${sanitizedName}`;
        }

        // Add APPROX_TOP_K conditionally based on column characteristics
        const shouldGetTopK = this.shouldComputeTopK(column);
        if (shouldGetTopK) {
          selectClause += `,
        APPROX_TOP_K(${columnName}, 50, 10000) AS topk_${sanitizedName}`;
        } else {
          selectClause += `,
        NULL AS topk_${sanitizedName}`;
        }

        return selectClause;
      })
      .join(',');

    // Build sample_values CTE - only for columns where samples make sense
    const eligibleForSamples = columns.filter((col) => !this.shouldSkipSampleValues(col));
    const sampleValuesUnions =
      eligibleForSamples.length > 0
        ? eligibleForSamples
            .map((column) => {
              const columnName = column.name;
              const dataType = column.dataType.toUpperCase();
              // For semi-structured types, convert to VARCHAR first
              const needsConversion =
                dataType.includes('VARIANT') ||
                dataType.includes('OBJECT') ||
                dataType.includes('ARRAY');
              const columnExpr = needsConversion
                ? `TO_VARCHAR(${columnName})`
                : `TO_VARCHAR(${columnName})`;

              return `
    SELECT '${columnName}' AS column_name,
           ARRAY_TO_STRING(
               ARRAY_AGG(
                   CASE 
                       WHEN LENGTH(sample_val) > 100 
                       THEN LEFT(sample_val, 100) || '...'
                       ELSE sample_val
                   END
               ) WITHIN GROUP (ORDER BY sample_val),
               ','
           ) AS sample_values
    FROM (
        SELECT DISTINCT ${columnExpr} AS sample_val
        FROM sample_data
        WHERE ${columnName} IS NOT NULL
        LIMIT 20
    )`;
            })
            .join('\n    UNION ALL')
        : `SELECT NULL AS column_name, NULL AS sample_values WHERE 1=0`;

    // Build stats CTE with UNION ALL for each column
    const statsUnions = columns
      .map((column) => {
        const columnName = column.name;
        const sanitizedName = this.sanitizeColumnName(columnName);
        const isNumeric = this.isNumericType(column.dataType);
        const isDate = this.isDateType(column.dataType);

        let minMaxClause = 'NULL AS min_value,\n        NULL AS max_value';
        if (isNumeric || isDate) {
          minMaxClause = `TO_VARCHAR(rs.min_${sanitizedName}) AS min_value,
        TO_VARCHAR(rs.max_${sanitizedName}) AS max_value`;
        }

        return `
    SELECT
        '${columnName}' AS column_name,
        rs.distinct_count_${sanitizedName} AS distinct_count,
        rs.null_count_${sanitizedName} AS null_count,
        rs.total_rows_${sanitizedName} AS total_rows,
        ${minMaxClause},
        rs.topk_${sanitizedName} AS topk_values
    FROM raw_stats rs`;
      })
      .join('\n    UNION ALL');

    // Combine all CTEs into final query
    return `
WITH 
sample_data AS (
    SELECT * FROM ${fullyQualifiedTable}${sampleClause}
),
raw_stats AS (
    SELECT
        ${rawStatsSelects}
    FROM sample_data
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
    s.total_rows,
    s.min_value,
    s.max_value,
    s.topk_values,
    sv.sample_values,
    ${shouldSample} AS is_sampled
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
   * Determine if we should compute TOP_K for a column based on its characteristics
   * Skip high-cardinality columns like IDs, UUIDs, timestamps, etc.
   */
  private shouldComputeTopK(column: Column): boolean {
    // Skip ID-like columns
    const skipPatterns = [
      /_id$/i, // Ends with _id
      /_uuid$/i, // Ends with _uuid
      /_guid$/i, // Ends with _guid
      /^id$/i, // Exactly "id"
      /_key$/i, // Ends with _key
      /_hash$/i, // Ends with _hash
      /_token$/i, // Ends with _token
      /_code$/i, // Ends with _code (often unique)
    ];

    if (skipPatterns.some((pattern) => pattern.test(column.name))) {
      return false;
    }

    // Skip timestamp/date columns
    if (this.isDateType(column.dataType)) {
      return false;
    }

    // Skip numeric columns unless they have very low cardinality (handled in query building)
    // This will be further refined based on distinct count if available

    return true;
  }

  /**
   * Determine if we should skip sample values for a column
   * Skip types that are not human-readable or meaningful as samples
   */
  private shouldSkipSampleValues(column: Column): boolean {
    const dataType = column.dataType.toUpperCase();

    // Skip spatial types - not human readable
    if (dataType.includes('GEOGRAPHY') || dataType.includes('GEOMETRY')) {
      return true;
    }

    // Skip binary types - hex strings are not meaningful
    if (dataType.includes('BINARY')) {
      return true;
    }

    // Skip high-cardinality columns (same logic as TOP_K)
    const skipPatterns = [/_id$/i, /_uuid$/i, /_guid$/i, /^id$/i, /_key$/i, /_hash$/i, /_token$/i];

    if (skipPatterns.some((pattern) => pattern.test(column.name))) {
      return true;
    }

    return false;
  }

  /**
   * Parse Snowflake's APPROX_TOP_K result into ValueDistribution array
   * APPROX_TOP_K returns a JSON array of [value, count] pairs
   */
  private parseTopKAsDistribution(
    topKResult: unknown,
    totalRows: number
  ): ValueDistribution[] | undefined {
    if (!topKResult || totalRows === 0) {
      return undefined;
    }

    try {
      // Handle if it's a string that needs parsing
      const parsed = typeof topKResult === 'string' ? JSON.parse(topKResult) : topKResult;

      if (!Array.isArray(parsed)) {
        return undefined;
      }

      return parsed.map(([value, count]: [unknown, number]) => ({
        value: String(value ?? 'NULL'),
        count: count || 0,
        percentage: totalRows > 0 ? (count / totalRows) * 100 : 0,
      }));
    } catch (error) {
      console.warn('Failed to parse TOP_K result:', error);
      return undefined;
    }
  }

  /**
   * Snowflake-optimized full introspection that takes advantage of caching
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
    const columnsWithStats = await this.attachColumnStatisticsSnowflake(tables, columns);

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
      indexes: [], // Snowflake doesn't expose index information
      foreignKeys: [], // Snowflake doesn't expose foreign key information
      introspectedAt: new Date(),
    };
  }

  /**
   * Attach column statistics to columns by processing tables in batches
   * This is a copy of the base implementation to avoid dependency issues
   */
  private async attachColumnStatisticsSnowflake(
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
              // Get column statistics with table row count for conditional sampling
              const columnStats = await this.getColumnStatistics(
                table.database,
                table.schema,
                table.name,
                table.rowCount
              );

              // Attach statistics to corresponding columns
              for (const stat of columnStats) {
                const key = `${table.database}.${table.schema}.${table.name}.${stat.columnName}`;
                const column = columnMap.get(key);
                if (column) {
                  column.distinctCount = stat.distinctCount ?? 0;
                  column.nullPercentage = stat.nullPercentage ?? 0;
                  column.minValue = stat.minValue ?? '';
                  column.maxValue = stat.maxValue ?? '';
                  column.sampleValues = stat.sampleValues ?? '';
                  if (stat.topKDistribution) {
                    column.topKDistribution = stat.topKDistribution;
                  }
                  column.isSampled = stat.isSampled ?? false;
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
