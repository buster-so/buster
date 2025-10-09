import type { DatabaseAdapter } from '../../../adapters/base';
import { DataSourceType } from '../../../types/credentials';
import type { QueryParameter } from '../../../types/query';
import type { IntrospectionFilters, StructuralMetadata, TableMetadata } from '../../types';
import {
  formatRowCount,
  getString,
  parseBoolean,
  parseDate,
  parseNumber,
  validateFilters,
} from '../../utils';

/**
 * Fetch structural metadata for Snowflake data source
 * Extracts and improves logic from existing SnowflakeIntrospector
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
    // Build the query with optional filters
    let query = `
      SELECT 
        t.TABLE_CATALOG as database_name,
        t.TABLE_SCHEMA as schema_name,
        t.TABLE_NAME as table_name,
        t.TABLE_TYPE as table_type,
        t.ROW_COUNT as row_count,
        t.BYTES as size_bytes,
        t.COMMENT as comment,
        t.CREATED as created_time,
        t.LAST_ALTERED as last_modified,
        t.CLUSTERING_KEY as clustering_key
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE t.TABLE_SCHEMA != 'INFORMATION_SCHEMA'
    `;

    // Apply filters
    const conditions: string[] = [];
    const params: QueryParameter[] = [];

    if (filters?.databases && filters.databases.length > 0) {
      conditions.push(`t.TABLE_CATALOG IN (${filters.databases.map(() => '?').join(',')})`);
      params.push(...filters.databases);
    }

    if (filters?.schemas && filters.schemas.length > 0) {
      conditions.push(`t.TABLE_SCHEMA IN (${filters.schemas.map(() => '?').join(',')})`);
      params.push(...filters.schemas);
    }

    if (filters?.tables && filters.tables.length > 0) {
      conditions.push(`t.TABLE_NAME IN (${filters.tables.map(() => '?').join(',')})`);
      params.push(...filters.tables);
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      conditions.push(`t.TABLE_NAME NOT IN (${filters.excludeTables.map(() => '?').join(',')})`);
      params.push(...filters.excludeTables);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY t.TABLE_CATALOG, t.TABLE_SCHEMA, t.TABLE_NAME';

    // Execute query
    const result = await adapter.query(query, params);

    // Parse results

    for (const row of result.rows) {
      const tableType = getString(row.table_type) || 'TABLE';

      // Map Snowflake table types to our standard types
      let mappedType: TableMetadata['type'] = 'TABLE';
      if (tableType === 'VIEW') mappedType = 'VIEW';
      else if (tableType === 'MATERIALIZED VIEW') mappedType = 'MATERIALIZED_VIEW';
      else if (tableType === 'EXTERNAL TABLE') mappedType = 'EXTERNAL_TABLE';
      else if (tableType === 'TEMPORARY TABLE') mappedType = 'TEMPORARY_TABLE';

      // Parse clustering key if present
      const clusteringKeyStr = getString(row.clustering_key);
      const clusteringKeys = clusteringKeyStr
        ? clusteringKeyStr.split(',').map((k) => k.trim())
        : undefined;

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
        clusteringKeys,
        metadata: {
          isTransient: parseBoolean(row.is_transient),
        },
      };

      tables.push(tableMeta);
    }

    return {
      dataSourceId: '', // Will be set by the caller
      dataSourceType: DataSourceType.Snowflake,
      tables,
      introspectedAt: startTime,
      filters,
    };
  } catch (error) {
    console.error('Failed to fetch Snowflake structural metadata:', error);
    throw new Error(
      `Failed to fetch structural metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
