import type { DatabaseAdapter } from '../../../adapters/base';
import { DataSourceType } from '../../../types/credentials';
import type { QueryParameter } from '../../../types/query';
import type { IntrospectionFilters, StructuralMetadata, TableMetadata } from '../../types';
import { formatRowCount, getString, parseDate, parseNumber, validateFilters } from '../../utils';

/**
 * Fetch structural metadata for MySQL data source
 * Uses information_schema.TABLES for metadata including row estimates
 */
export async function getStructuralMetadata(
  adapter: DatabaseAdapter,
  filters?: IntrospectionFilters
): Promise<StructuralMetadata> {
  // Validate filters
  validateFilters(filters);

  const tables: TableMetadata[] = [];
  const startTime = new Date();

  try {
    // Build query using information_schema
    let query = `
      SELECT 
        t.TABLE_SCHEMA as database_name,
        t.TABLE_SCHEMA as schema_name,
        t.TABLE_NAME as table_name,
        t.TABLE_TYPE as table_type,
        t.TABLE_ROWS as row_count,
        t.DATA_LENGTH + t.INDEX_LENGTH as size_bytes,
        t.TABLE_COMMENT as comment,
        t.CREATE_TIME as created_time,
        t.UPDATE_TIME as last_modified,
        t.ENGINE as engine,
        t.AUTO_INCREMENT as auto_increment
      FROM information_schema.TABLES t
      WHERE t.TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
    `;

    // Apply filters
    const conditions: string[] = [];
    const params: QueryParameter[] = [];

    // In MySQL, schema and database are the same thing
    if (filters?.databases && filters.databases.length > 0) {
      const placeholders = filters.databases.map(() => '?').join(',');
      conditions.push(`t.TABLE_SCHEMA IN (${placeholders})`);
      params.push(...filters.databases);
    }

    if (filters?.schemas && filters.schemas.length > 0) {
      const placeholders = filters.schemas.map(() => '?').join(',');
      conditions.push(`t.TABLE_SCHEMA IN (${placeholders})`);
      params.push(...filters.schemas);
    }

    if (filters?.tables && filters.tables.length > 0) {
      const placeholders = filters.tables.map(() => '?').join(',');
      conditions.push(`t.TABLE_NAME IN (${placeholders})`);
      params.push(...filters.tables);
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      const placeholders = filters.excludeTables.map(() => '?').join(',');
      conditions.push(`t.TABLE_NAME NOT IN (${placeholders})`);
      params.push(...filters.excludeTables);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME';

    // Execute query
    const result = await adapter.query(query, params);

    // Parse results

    for (const row of result.rows) {
      const tableType = getString(row.table_type) || 'BASE TABLE';

      // Map MySQL table types to our standard types
      let mappedType: TableMetadata['type'] = 'TABLE';
      if (tableType === 'VIEW') mappedType = 'VIEW';
      else if (tableType === 'SYSTEM VIEW') mappedType = 'VIEW';
      else if (tableType === 'TEMPORARY') mappedType = 'TEMPORARY_TABLE';

      const tableMeta: TableMetadata = {
        name: getString(row.table_name) || '',
        schema: getString(row.schema_name) || '',
        database: getString(row.database_name) || '',
        rowCount: formatRowCount(row.row_count),
        sizeBytes: parseNumber(row.size_bytes),
        type: mappedType,
        comment: getString(row.comment),
        created: parseDate(row.created_time),
        lastModified: parseDate(row.last_modified),
        metadata: {
          engine: getString(row.engine),
          autoIncrement: parseNumber(row.auto_increment),
        },
      };

      tables.push(tableMeta);
    }

    return {
      dataSourceId: '', // Will be set by the caller
      dataSourceType: DataSourceType.MySQL,
      tables,
      introspectedAt: startTime,
      filters,
    };
  } catch (error) {
    console.error('Failed to fetch MySQL structural metadata:', error);
    throw new Error(
      `Failed to fetch structural metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
