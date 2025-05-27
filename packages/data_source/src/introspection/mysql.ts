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
 */
export class MySQLIntrospector extends BaseIntrospector {
  private adapter: DatabaseAdapter;

  constructor(dataSourceName: string, adapter: DatabaseAdapter) {
    super(dataSourceName);
    this.adapter = adapter;
  }

  getDataSourceType(): string {
    return DataSourceType.MySQL;
  }

  async getDatabases(): Promise<Database[]> {
    const result = await this.adapter.query('SHOW DATABASES');

    return result.rows
      .filter((row) => {
        const name = this.getString(row.Database);
        return name && !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(name);
      })
      .map((row) => ({
        name: this.getString(row.Database) || '',
      }));
  }

  async getSchemas(_database?: string): Promise<Schema[]> {
    // In MySQL, databases and schemas are the same concept
    const databases = await this.getDatabases();
    return databases.map((db) => ({
      name: db.name,
      database: db.name,
      owner: db.owner,
      comment: db.comment,
    }));
  }

  async getTables(database?: string, schema?: string): Promise<Table[]> {
    const targetDatabase = database || schema;
    if (!targetDatabase) {
      // Get all databases and their tables
      const databases = await this.getDatabases();
      const allTables: Table[] = [];

      for (const db of databases) {
        try {
          const dbTables = await this.getTables(db.name);
          allTables.push(...dbTables);
        } catch (error) {
          console.warn(`Could not access tables in database ${db.name}:`, error);
        }
      }

      return allTables;
    }

    const result = await this.adapter.query(`
      SELECT table_schema as database_name,
             table_name as name,
             table_type as type,
             table_comment as comment,
             create_time as created,
             update_time as last_modified
      FROM information_schema.tables
      WHERE table_schema = '${targetDatabase}'
      ORDER BY table_name
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      schema: this.getString(row.database_name) || '',
      database: this.getString(row.database_name) || '',
      type: this.mapTableType(this.getString(row.type)),
      comment: this.getString(row.comment),
      created: this.parseDate(row.created),
      lastModified: this.parseDate(row.last_modified),
    }));
  }

  async getColumns(database?: string, schema?: string, table?: string): Promise<Column[]> {
    const targetDatabase = database || schema;

    let whereClause =
      "WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')";
    if (targetDatabase && table) {
      whereClause = `WHERE table_schema = '${targetDatabase}' AND table_name = '${table}'`;
    } else if (targetDatabase) {
      whereClause = `WHERE table_schema = '${targetDatabase}'`;
    }

    const result = await this.adapter.query(`
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

    return result.rows.map((row) => ({
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
  }

  async getViews(database?: string, schema?: string): Promise<View[]> {
    const targetDatabase = database || schema;

    let whereClause =
      "WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')";
    if (targetDatabase) {
      whereClause = `WHERE table_schema = '${targetDatabase}'`;
    }

    const result = await this.adapter.query(`
      SELECT table_schema as database_name,
             table_name as name,
             view_definition as definition
      FROM information_schema.views
      ${whereClause}
      ORDER BY table_schema, table_name
    `);

    return result.rows.map((row) => ({
      name: this.getString(row.name) || '',
      schema: this.getString(row.database_name) || '',
      database: this.getString(row.database_name) || '',
      definition: this.getString(row.definition) || '',
    }));
  }

  async getTableStatistics(
    database: string,
    schema: string,
    table: string
  ): Promise<TableStatistics> {
    const targetDatabase = database || schema;

    // Get basic table statistics
    const tableStatsResult = await this.adapter.query(`
      SELECT table_rows as row_count,
             data_length + index_length as size_bytes
      FROM information_schema.tables
      WHERE table_schema = '${targetDatabase}' AND table_name = '${table}'
    `);

    // Get column statistics
    const columns = await this.getColumns(targetDatabase, undefined, table);
    const columnStatistics: ColumnStatistics[] = [];

    for (const column of columns) {
      try {
        let statsQuery = '';

        if (this.isNumericType(column.dataType)) {
          statsQuery = `
            SELECT 
              '${column.name}' as column_name,
              COUNT(DISTINCT \`${column.name}\`) as distinct_count,
              COUNT(*) - COUNT(\`${column.name}\`) as null_count,
              MIN(\`${column.name}\`) as min_value,
              MAX(\`${column.name}\`) as max_value,
              AVG(\`${column.name}\`) as avg_value
            FROM \`${targetDatabase}\`.\`${table}\`
          `;
        } else {
          statsQuery = `
            SELECT 
              '${column.name}' as column_name,
              COUNT(DISTINCT \`${column.name}\`) as distinct_count,
              COUNT(*) - COUNT(\`${column.name}\`) as null_count,
              NULL as min_value,
              NULL as max_value,
              NULL as avg_value
            FROM \`${targetDatabase}\`.\`${table}\`
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
      schema: targetDatabase,
      database: targetDatabase,
      rowCount: this.parseNumber(basicStats?.row_count),
      sizeBytes: this.parseNumber(basicStats?.size_bytes),
      columnStatistics,
      lastUpdated: new Date(),
    };
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
}
