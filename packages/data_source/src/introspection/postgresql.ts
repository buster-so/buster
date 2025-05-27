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
 */
export class PostgreSQLIntrospector extends BaseIntrospector {
  private adapter: DatabaseAdapter;

  constructor(dataSourceName: string, adapter: DatabaseAdapter) {
    super(dataSourceName);
    this.adapter = adapter;
  }

  getDataSourceType(): string {
    return DataSourceType.PostgreSQL;
  }

  async getDatabases(): Promise<Database[]> {
    const result = await this.adapter.query(`
      SELECT datname as name, 
             pg_catalog.pg_get_userbyid(datdba) as owner,
             pg_catalog.shobj_description(oid, 'pg_database') as comment
      FROM pg_catalog.pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      owner: this.getString(row.owner),
      comment: this.getString(row.comment),
    }));
  }

  async getSchemas(database?: string): Promise<Schema[]> {
    const result = await this.adapter.query(`
      SELECT schema_name as name,
             catalog_name as database,
             schema_owner as owner
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      database: this.getString(row.database) || database || '',
      owner: this.getString(row.owner),
    }));
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    let whereClause = "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')";
    if (schema) {
      whereClause += ` AND table_schema = '${schema}'`;
    }

    const result = await this.adapter.query(`
      SELECT table_catalog as database,
             table_schema as schema,
             table_name as name,
             table_type as type
      FROM information_schema.tables
      ${whereClause}
      ORDER BY table_schema, table_name
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      schema: this.getString(row.schema) || '',
      database: this.getString(row.database) || database || '',
      type: this.mapTableType(this.getString(row.type)),
    }));
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    let whereClause = "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')";
    if (schema && table) {
      whereClause += ` AND table_schema = '${schema}' AND table_name = '${table}'`;
    } else if (schema) {
      whereClause += ` AND table_schema = '${schema}'`;
    }

    const result = await this.adapter.query(`
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
      ${whereClause}
      ORDER BY table_schema, table_name, ordinal_position
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      table: this.getString(row.table) || '',
      schema: this.getString(row.schema) || '',
      database: this.getString(row.database) || database || '',
      position: this.parseNumber(row.position) || 0,
      dataType: this.getString(row.data_type) || '',
      isNullable: this.getString(row.is_nullable) === 'YES',
      defaultValue: this.getString(row.default_value),
      maxLength: this.parseNumber(row.max_length),
      precision: this.parseNumber(row.precision),
      scale: this.parseNumber(row.scale),
    }));
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    let whereClause = "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')";
    if (schema) {
      whereClause += ` AND table_schema = '${schema}'`;
    }

    const result = await this.adapter.query(`
      SELECT table_catalog as database,
             table_schema as schema,
             table_name as name,
             view_definition as definition
      FROM information_schema.views
      ${whereClause}
      ORDER BY table_schema, table_name
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      schema: this.getString(row.schema) || '',
      database: this.getString(row.database) || database || '',
      definition: this.getString(row.definition) || '',
    }));
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    // Get basic table statistics
    const tableStatsResult = await this.adapter.query(`
      SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
      FROM pg_stat_user_tables 
      WHERE schemaname = '${schema}' AND tablename = '${table}'
    `);

    // Get column statistics
    const columns = await this.getColumns(database, schema, table);
    const columnStatistics: ColumnStatistics[] = [];

    for (const column of columns) {
      try {
        let statsQuery = '';

        if (this.isNumericType(column.dataType)) {
          statsQuery = `
            SELECT 
              '${column.name}' as column_name,
              COUNT(DISTINCT ${column.name}) as distinct_count,
              COUNT(*) - COUNT(${column.name}) as null_count,
              MIN(${column.name}) as min_value,
              MAX(${column.name}) as max_value,
              AVG(${column.name}) as avg_value
            FROM ${schema}.${table}
          `;
        } else {
          statsQuery = `
            SELECT 
              '${column.name}' as column_name,
              COUNT(DISTINCT ${column.name}) as distinct_count,
              COUNT(*) - COUNT(${column.name}) as null_count,
              NULL as min_value,
              NULL as max_value,
              NULL as avg_value
            FROM ${schema}.${table}
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
        console.warn(`Could not get statistics for column ${column.name}:`, error);
      }
    }

    const basicStats = tableStatsResult.rows[0];

    return {
      table,
      schema,
      database,
      rowCount: this.parseNumber(basicStats?.n_live_tup),
      columnStatistics,
      lastUpdated: new Date(),
    };
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
}
