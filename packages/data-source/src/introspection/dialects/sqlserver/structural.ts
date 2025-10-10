import type { DatabaseAdapter } from '../../../adapters/base';
import { DataSourceType } from '../../../types/credentials';
import type { IntrospectionFilters, StructuralMetadata, TableMetadata } from '../../types';
import { formatRowCount, getString, parseDate, parseNumber, validateFilters } from '../../utils';

/**
 * Fetch structural metadata for SQL Server data source
 * Uses system catalog views for metadata
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
    // Build query using SQL Server system views
    let query = `
      SELECT 
        DB_NAME() as database_name,
        s.name as schema_name,
        t.name as table_name,
        t.type_desc as table_type,
        p.rows as row_count,
        SUM(a.total_pages) * 8 * 1024 as size_bytes,
        ep.value as comment,
        t.create_date as created_time,
        t.modify_date as last_modified
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.indexes i ON t.object_id = i.object_id
      INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
      INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
      LEFT JOIN sys.extended_properties ep 
        ON ep.major_id = t.object_id 
        AND ep.minor_id = 0 
        AND ep.name = 'MS_Description'
      WHERE i.index_id <= 1
        AND s.name NOT IN ('sys', 'INFORMATION_SCHEMA')
    `;

    // Apply filters
    const conditions: string[] = [];

    if (filters?.databases && filters.databases.length > 0) {
      const list = filters.databases.map((d) => `'${d}'`).join(',');
      conditions.push(`DB_NAME() IN (${list})`);
    }

    if (filters?.schemas && filters.schemas.length > 0) {
      const list = filters.schemas.map((s) => `'${s}'`).join(',');
      conditions.push(`s.name IN (${list})`);
    }

    if (filters?.tables && filters.tables.length > 0) {
      const list = filters.tables.map((t) => `'${t}'`).join(',');
      conditions.push(`t.name IN (${list})`);
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      const list = filters.excludeTables.map((t) => `'${t}'`).join(',');
      conditions.push(`t.name NOT IN (${list})`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY DB_NAME(), s.name, t.name, t.type_desc, p.rows, ep.value, t.create_date, t.modify_date`;

    // Add views
    query += `
      UNION ALL
      SELECT 
        DB_NAME() as database_name,
        s.name as schema_name,
        v.name as table_name,
        'VIEW' as table_type,
        0 as row_count,
        0 as size_bytes,
        ep.value as comment,
        v.create_date as created_time,
        v.modify_date as last_modified
      FROM sys.views v
      INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
      LEFT JOIN sys.extended_properties ep 
        ON ep.major_id = v.object_id 
        AND ep.minor_id = 0 
        AND ep.name = 'MS_Description'
      WHERE s.name NOT IN ('sys', 'INFORMATION_SCHEMA')
    `;

    if (filters?.schemas && filters.schemas.length > 0) {
      const list = filters.schemas.map((s) => `'${s}'`).join(',');
      query += ` AND s.name IN (${list})`;
    }

    if (filters?.tables && filters.tables.length > 0) {
      const list = filters.tables.map((t) => `'${t}'`).join(',');
      query += ` AND v.name IN (${list})`;
    }

    if (filters?.excludeTables && filters.excludeTables.length > 0) {
      const list = filters.excludeTables.map((t) => `'${t}'`).join(',');
      query += ` AND v.name NOT IN (${list})`;
    }

    query += ' ORDER BY database_name, schema_name, table_name';

    // Execute query
    const result = await adapter.query(query);

    // Parse results
    for (const row of result.rows) {
      const tableType = getString(row.table_type) || 'USER_TABLE';

      // Map SQL Server table types to our standard types
      let mappedType: TableMetadata['type'] = 'TABLE';
      if (tableType === 'VIEW') mappedType = 'VIEW';
      else if (tableType === 'EXTERNAL_TABLE') mappedType = 'EXTERNAL_TABLE';

      tables.push({
        name: getString(row.table_name) || '',
        schema: getString(row.schema_name) || '',
        database: getString(row.database_name) || '',
        rowCount: formatRowCount(row.row_count),
        sizeBytes: parseNumber(row.size_bytes),
        type: mappedType,
        comment: getString(row.comment),
        created: parseDate(row.created_time),
        lastModified: parseDate(row.last_modified),
      });
    }

    return {
      dataSourceId: '', // Will be set by the caller
      dataSourceType: DataSourceType.SQLServer,
      tables,
      introspectedAt: startTime,
      filters,
    };
  } catch (error) {
    console.error('Failed to fetch SQL Server structural metadata:', error);
    throw new Error(
      `Failed to fetch structural metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
