import type { DatabaseAdapter } from '../../../adapters/base';
import { DataSourceType } from '../../../types/credentials';
import type { QueryParameter } from '../../../types/query';
import type { IntrospectionFilters, StructuralMetadata, TableMetadata } from '../../types';
import { formatRowCount, getString, parseDate, parseNumber, validateFilters } from '../../utils';

/**
 * Fetch structural metadata for Redshift data source
 * Redshift is PostgreSQL-compatible, so we use similar queries
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
    // Build query using Redshift's system tables
    let query = `
      SELECT 
        current_database() as database_name,
        schemaname as schema_name,
        tablename as table_name,
        'TABLE' as table_type,
        COALESCE(tbl_rows, 0) as row_count,
        size * 1024 * 1024 as size_bytes
      FROM SVV_TABLE_INFO
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    `;

    // Apply filters
    const conditions: string[] = [];
    const params: QueryParameter[] = [];
    let paramIndex = 1;

    if (filters?.databases && filters.databases.length > 0) {
      conditions.push(`current_database() = ANY($${paramIndex}::text[])`);
      params.push(filters.databases);
      paramIndex++;
    }

    if (filters?.schemas && filters.schemas.length > 0) {
      conditions.push(`schemaname = ANY($${paramIndex}::text[])`);
      params.push(filters.schemas);
      paramIndex++;
    }

    if (filters?.tables && filters.tables.length > 0) {
      conditions.push(`tablename = ANY($${paramIndex}::text[])`);
      params.push(filters.tables);
      paramIndex++;
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      conditions.push(`tablename != ALL($${paramIndex}::text[])`);
      params.push(filters.excludeTables);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Add views separately
    query += `
      UNION ALL
      SELECT 
        current_database() as database_name,
        schemaname as schema_name,
        viewname as table_name,
        'VIEW' as table_type,
        0 as row_count,
        0 as size_bytes
      FROM pg_views
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `;

    if (conditions.length > 0) {
      query += ` AND ${conditions
        .join(' AND ')
        .replace(/tablename/g, 'viewname')
        .replace(/schemaname/g, 'schemaname')}`;
    }

    query += ' ORDER BY database_name, schema_name, table_name';

    // Execute query
    const result = await adapter.query(query, params);

    // Parse results
    for (const row of result.rows) {
      const tableType = getString(row.table_type) || 'TABLE';

      // Map table types to our standard types
      let mappedType: TableMetadata['type'] = 'TABLE';
      if (tableType === 'VIEW') mappedType = 'VIEW';

      tables.push({
        name: getString(row.table_name) || '',
        schema: getString(row.schema_name) || '',
        database: getString(row.database_name) || '',
        rowCount: formatRowCount(row.row_count),
        sizeBytes: parseNumber(row.size_bytes),
        type: mappedType,
        comment: undefined,
        created: undefined,
        lastModified: undefined,
      });
    }

    return {
      dataSourceId: '', // Will be set by the caller
      dataSourceType: DataSourceType.Redshift,
      tables,
      introspectedAt: startTime,
      filters,
    };
  } catch (error) {
    console.error('Failed to fetch Redshift structural metadata:', error);
    throw new Error(
      `Failed to fetch structural metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
