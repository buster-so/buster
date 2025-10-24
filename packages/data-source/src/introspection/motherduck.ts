/**
 * MotherDuck introspector implementation
 * Uses DuckDB system tables for schema discovery
 */

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
 * MotherDuck-specific introspector implementation
 * Leverages DuckDB system tables and functions for metadata
 */
export class MotherDuckIntrospector extends BaseIntrospector {
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
    return DataSourceType.MotherDuck;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(lastFetched: Date): boolean {
    return Date.now() - lastFetched.getTime() < this.CACHE_TTL;
  }

  /**
   * Get all databases
   * Uses duckdb_databases() system function
   */
  async getDatabases(): Promise<Database[]> {
    if (this.cache.databases && this.isCacheValid(this.cache.databases.lastFetched)) {
      return this.cache.databases.data;
    }

    try {
      const result = await this.adapter.query(`
        SELECT
          database_name as name,
          path,
          internal as is_internal
        FROM duckdb_databases()
        WHERE NOT internal
        ORDER BY database_name
      `);

      const databases = result.rows.map((row) => ({
        name: this.getString(row.name) || '',
        owner: '',
        comment: '',
        metadata: {
          path: this.getString(row.path),
          is_internal: row.is_internal,
        },
      }));

      this.cache.databases = { data: databases, lastFetched: new Date() };
      return databases;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Get schemas with optional database filter
   */
  async getSchemas(database?: string): Promise<Schema[]> {
    if (!database && this.cache.schemas && this.isCacheValid(this.cache.schemas.lastFetched)) {
      return this.cache.schemas.data;
    }

    if (this.cache.schemas && this.isCacheValid(this.cache.schemas.lastFetched)) {
      const schemas = this.cache.schemas.data;
      return database ? schemas.filter((schema) => schema.database === database) : schemas;
    }

    try {
      let whereClause = "WHERE schema_name NOT IN ('information_schema', 'pg_catalog')";
      if (database) {
        whereClause += ` AND catalog_name = '${database}'`;
      }

      const result = await this.adapter.query(`
        SELECT
          schema_name as name,
          catalog_name as database
        FROM information_schema.schemata
        ${whereClause}
        ORDER BY schema_name
      `);

      const schemas = result.rows.map((row) => ({
        name: this.getString(row.name) || '',
        database: this.getString(row.database) || '',
        owner: '',
      }));

      if (!database) {
        this.cache.schemas = { data: schemas, lastFetched: new Date() };
      }

      return schemas;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Get tables with optional filters
   */
  async getTables(database?: string, schema?: string): Promise<Table[]> {
    if (
      !database &&
      !schema &&
      this.cache.tables &&
      this.isCacheValid(this.cache.tables.lastFetched)
    ) {
      return this.cache.tables.data;
    }

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
      let whereClause = "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')";

      if (database && schema) {
        whereClause += ` AND table_catalog = '${database}' AND table_schema = '${schema}'`;
      } else if (schema) {
        whereClause += ` AND table_schema = '${schema}'`;
      } else if (database) {
        whereClause += ` AND table_catalog = '${database}'`;
      }

      const result = await this.adapter.query(`
        SELECT
          table_catalog as database,
          table_schema as schema,
          table_name as name,
          table_type as type
        FROM information_schema.tables
        ${whereClause}
        AND table_type != 'VIEW'
        ORDER BY schema, name
      `);

      const tables = result.rows.map((row) => ({
        name: this.getString(row.name) || '',
        schema: this.getString(row.schema) || '',
        database: this.getString(row.database) || '',
        type: this.mapTableType(this.getString(row.type)),
        rowCount: 0,
        sizeBytes: 0,
      }));

      // Enrich with row counts and sizes if filtering by database and schema
      // This is expensive, so only do it when we have specific filters
      if (database && schema) {
        const enrichedTables = await Promise.all(
          tables.map(async (table) => {
            try {
              // Get row count
              const countQuery = `
                SELECT COUNT(*) as row_count
                FROM "${table.database}"."${table.schema}"."${table.name}"
              `;
              const countResult = await this.adapter.query(countQuery);
              const rowCount = countResult.rows[0]?.row_count
                ? Number(countResult.rows[0].row_count)
                : 0;

              return {
                ...table,
                rowCount,
                sizeBytes: 0, // DuckDB doesn't easily expose table size
              };
            } catch (_error) {
              // If enrichment fails, return table with default values
              return table;
            }
          })
        );

        return enrichedTables;
      }

      if (!database && !schema) {
        this.cache.tables = { data: tables, lastFetched: new Date() };
      }

      return tables;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Get columns with optional filters
   */
  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    try {
      let whereClause = "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')";

      if (database && schema && table) {
        whereClause += ` AND table_catalog = '${database}' AND table_schema = '${schema}' AND table_name = '${table}'`;
      } else if (schema && table) {
        whereClause += ` AND table_schema = '${schema}' AND table_name = '${table}'`;
      } else if (schema) {
        whereClause += ` AND table_schema = '${schema}'`;
      } else if (database) {
        whereClause += ` AND table_catalog = '${database}'`;
      } else if (table) {
        whereClause += ` AND table_name = '${table}'`;
      }

      const result = await this.adapter.query(`
        SELECT
          table_catalog as database,
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
        ${whereClause}
        ORDER BY table_schema, table_name, ordinal_position
      `);

      return result.rows.map((row) => ({
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
    } catch (_error) {
      return [];
    }
  }

  /**
   * Get views with optional filters
   */
  async getViews(database?: string, schema?: string): Promise<View[]> {
    try {
      let whereClause = "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')";

      if (database && schema) {
        whereClause += ` AND table_catalog = '${database}' AND table_schema = '${schema}'`;
      } else if (schema) {
        whereClause += ` AND table_schema = '${schema}'`;
      } else if (database) {
        whereClause += ` AND table_catalog = '${database}'`;
      }

      const result = await this.adapter.query(`
        SELECT
          table_catalog as database,
          table_schema as schema,
          table_name as name,
          view_definition
        FROM information_schema.views
        ${whereClause}
        ORDER BY schema, name
      `);

      return result.rows.map((row) => ({
        name: this.getString(row.name) || '',
        schema: this.getString(row.schema) || '',
        database: this.getString(row.database) || '',
        definition: this.getString(row.view_definition) || '',
      }));
    } catch (_error) {
      return [];
    }
  }

  /**
   * Get table statistics (basic implementation)
   */
  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    return {
      table,
      schema,
      database,
      rowCount: 0,
      columnStatistics: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Get column statistics (basic implementation)
   */
  async getColumnStatistics(
    _database: string,
    _schema: string,
    _table: string
  ): Promise<ColumnStatistics[]> {
    return [];
  }

  /**
   * Map DuckDB table types to standard types
   */
  private mapTableType(
    duckdbType: string | undefined
  ): 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' {
    if (!duckdbType) return 'TABLE';

    const type = duckdbType.toUpperCase();
    if (type.includes('VIEW')) return 'VIEW';
    if (type.includes('EXTERNAL')) return 'EXTERNAL_TABLE';
    if (type.includes('TEMPORARY') || type.includes('TEMP')) return 'TEMPORARY_TABLE';
    return 'TABLE';
  }
}
