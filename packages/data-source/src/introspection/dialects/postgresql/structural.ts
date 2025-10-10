import type { DatabaseAdapter } from '../../../adapters/base';
import { DataSourceType } from '../../../types/credentials';
import type { QueryParameter } from '../../../types/query';
import type { IntrospectionFilters, StructuralMetadata, TableMetadata } from '../../types';
import { formatRowCount, getString, parseDate, parseNumber, validateFilters } from '../../utils';

/**
 * Fetch structural metadata for PostgreSQL data source
 * Uses pg_stat_user_tables for row estimates and information_schema for structure
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
    // Build query combining information_schema with pg_stat_user_tables for row estimates
    let query = `
      SELECT 
        current_database() as database_name,
        t.table_schema as schema_name,
        t.table_name as table_name,
        t.table_type as table_type,
        COALESCE(s.n_live_tup, 0) as row_count,
        pg_relation_size(quote_ident(t.table_schema)||'.'||quote_ident(t.table_name)) as size_bytes,
        obj_description(c.oid) as comment,
        s.last_vacuum as last_vacuum,
        s.last_analyze as last_analyze
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s 
        ON s.schemaname = t.table_schema 
        AND s.relname = t.table_name
      LEFT JOIN pg_class c 
        ON c.relname = t.table_name
        AND c.relnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = t.table_schema
        )
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    `;

    // Apply filters
    const conditions: string[] = [];
    const params: QueryParameter[] = [];
    let paramIndex = 1;

    // PostgreSQL doesn't have multiple databases per connection, so database filter is ignored
    // unless we want to filter by current database
    if (filters?.databases && filters.databases.length > 0) {
      // We can only check if current database matches
      conditions.push(`current_database() = ANY($${paramIndex}::text[])`);
      params.push(filters.databases);
      paramIndex++;
    }

    if (filters?.schemas && filters.schemas.length > 0) {
      conditions.push(`t.table_schema = ANY($${paramIndex}::text[])`);
      params.push(filters.schemas);
      paramIndex++;
    }

    if (filters?.tables && filters.tables.length > 0) {
      conditions.push(`t.table_name = ANY($${paramIndex}::text[])`);
      params.push(filters.tables);
      paramIndex++;
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      conditions.push(`t.table_name != ALL($${paramIndex}::text[])`);
      params.push(filters.excludeTables);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY t.table_schema, t.table_name';

    // Execute query
    const result = await adapter.query(query, params);

    // Parse results

    for (const row of result.rows) {
      const tableType = getString(row.table_type) || 'BASE TABLE';

      // Map PostgreSQL table types to our standard types
      let mappedType: TableMetadata['type'] = 'TABLE';
      if (tableType === 'VIEW') mappedType = 'VIEW';
      else if (tableType === 'MATERIALIZED VIEW') mappedType = 'MATERIALIZED_VIEW';
      else if (tableType === 'FOREIGN TABLE') mappedType = 'EXTERNAL_TABLE';
      else if (tableType === 'LOCAL TEMPORARY') mappedType = 'TEMPORARY_TABLE';

      const tableMeta: TableMetadata = {
        name: getString(row.table_name) || '',
        schema: getString(row.schema_name) || '',
        database: getString(row.database_name) || '',
        rowCount: formatRowCount(row.row_count),
        sizeBytes: parseNumber(row.size_bytes),
        type: mappedType,
        comment: getString(row.comment),
        created: undefined, // PostgreSQL doesn't track table creation time
        lastModified: parseDate(row.last_vacuum) || parseDate(row.last_analyze),
        metadata: {
          lastVacuum: parseDate(row.last_vacuum),
          lastAnalyze: parseDate(row.last_analyze),
        },
      };

      tables.push(tableMeta);
    }

    return {
      dataSourceId: '', // Will be set by the caller
      dataSourceType: DataSourceType.PostgreSQL,
      tables,
      introspectedAt: startTime,
      filters,
    };
  } catch (error) {
    console.error('Failed to fetch PostgreSQL structural metadata:', error);
    throw new Error(
      `Failed to fetch structural metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
