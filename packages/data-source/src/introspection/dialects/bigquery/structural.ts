import type { DatabaseAdapter } from '../../../adapters/base';
import { DataSourceType } from '../../../types/credentials';
import type { IntrospectionFilters, StructuralMetadata, TableMetadata } from '../../types';
import { formatRowCount, getString, parseDate, parseNumber, validateFilters } from '../../utils';

/**
 * Fetch structural metadata for BigQuery data source
 * Uses INFORMATION_SCHEMA for metadata
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
    // Build query using BigQuery's INFORMATION_SCHEMA
    let query = `
      SELECT 
        table_catalog as database_name,
        table_schema as schema_name,
        table_name as table_name,
        table_type as table_type,
        row_count as row_count,
        size_bytes as size_bytes,
        creation_time as created_time,
        CAST(NULL AS TIMESTAMP) as last_modified
      FROM \`INFORMATION_SCHEMA.TABLE_STORAGE_BY_ORGANIZATION\`
      WHERE table_schema NOT IN ('INFORMATION_SCHEMA')
    `;

    // Apply filters
    const conditions: string[] = [];

    if (filters?.databases && filters.databases.length > 0) {
      const list = filters.databases.map((d) => `'${d}'`).join(',');
      conditions.push(`table_catalog IN (${list})`);
    }

    if (filters?.schemas && filters.schemas.length > 0) {
      const list = filters.schemas.map((s) => `'${s}'`).join(',');
      conditions.push(`table_schema IN (${list})`);
    }

    if (filters?.tables && filters.tables.length > 0) {
      const list = filters.tables.map((t) => `'${t}'`).join(',');
      conditions.push(`table_name IN (${list})`);
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      const list = filters.excludeTables.map((t) => `'${t}'`).join(',');
      conditions.push(`table_name NOT IN (${list})`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY table_catalog, table_schema, table_name';

    // Execute query
    const result = await adapter.query(query);

    // Parse results
    for (const row of result.rows) {
      const tableType = getString(row.table_type) || 'TABLE';

      // Map BigQuery table types to our standard types
      let mappedType: TableMetadata['type'] = 'TABLE';
      if (tableType === 'VIEW') mappedType = 'VIEW';
      else if (tableType === 'MATERIALIZED VIEW') mappedType = 'MATERIALIZED_VIEW';
      else if (tableType === 'EXTERNAL') mappedType = 'EXTERNAL_TABLE';

      tables.push({
        name: getString(row.table_name) || '',
        schema: getString(row.schema_name) || '',
        database: getString(row.database_name) || '',
        rowCount: formatRowCount(row.row_count),
        sizeBytes: parseNumber(row.size_bytes),
        type: mappedType,
        comment: undefined,
        created: parseDate(row.created_time),
        lastModified: parseDate(row.last_modified),
      });
    }

    return {
      dataSourceId: '', // Will be set by the caller
      dataSourceType: DataSourceType.BigQuery,
      tables,
      introspectedAt: startTime,
      filters,
    };
  } catch (error) {
    console.error('Failed to fetch BigQuery structural metadata:', error);
    throw new Error(
      `Failed to fetch structural metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
