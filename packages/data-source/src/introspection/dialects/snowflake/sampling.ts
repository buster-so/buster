import type { DatabaseAdapter } from '../../../adapters/base';
import type { ColumnSchema, TableMetadata, TableSample } from '../../types';
import { calculateSamplePercentage, getQualifiedTableName } from '../../utils';

/**
 * Sample a Snowflake table using efficient sampling methods
 * - For tables: Uses TABLESAMPLE BERNOULLI for efficient random sampling
 * - For views: Uses LIMIT to fetch up to 1M rows
 */
export async function getTableSample(
  adapter: DatabaseAdapter,
  table: TableMetadata,
  sampleSize: number
): Promise<TableSample> {
  const startTime = new Date();
  const qualifiedTable = getQualifiedTableName(
    table.database,
    table.schema,
    table.name,
    'snowflake'
  );

  try {
    // For views, use hash-based sampling for better distribution
    if (table.type === 'VIEW') {
      const maxViewSample = 500000; // Reduced from 1M for better performance
      const viewSampleSize = Math.min(sampleSize, maxViewSample);

      // Try hash-based sampling first for pseudo-random distribution
      try {
        // HASH(*) in Snowflake hashes the entire row
        // MOD 10 gives us ~10% sample which should be enough for 500k from most views
        const hashQuery = `
          SELECT * FROM ${qualifiedTable}
          WHERE MOD(HASH(*), 10) = 0
          LIMIT ${viewSampleSize}
        `;

        const result = await adapter.query(hashQuery, undefined, viewSampleSize);

        // If we got at least 50% of requested rows, consider it successful
        if (result.rows.length >= viewSampleSize * 0.5) {
          const columnSchemas: ColumnSchema[] = result.fields.map((field) => ({
            name: field.name,
            type: field.type,
            nullable: field.nullable,
            length: field.length,
            precision: field.precision,
            scale: field.scale,
          }));

          return {
            tableId: `${table.database}.${table.schema}.${table.name}`,
            rowCount: table.rowCount,
            sampleSize: result.rows.length,
            sampleData: result.rows,
            columnSchemas,
            sampledAt: startTime,
            samplingMethod: 'VIEW_HASH_SAMPLE',
          };
        }
      } catch {
        // Hash sampling failed or returned too few rows, fall through to simple LIMIT
      }

      // Fallback to simple LIMIT if hash sampling fails
      const query = `SELECT * FROM ${qualifiedTable} LIMIT ${viewSampleSize}`;
      const result = await adapter.query(query, undefined, viewSampleSize);

      const columnSchemas: ColumnSchema[] = result.fields.map((field) => ({
        name: field.name,
        type: field.type,
        nullable: field.nullable,
        length: field.length,
        precision: field.precision,
        scale: field.scale,
      }));

      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        columnSchemas,
        sampledAt: startTime,
        samplingMethod: 'VIEW_LIMIT',
      };
    }

    // For small tables, just fetch all rows
    if (table.rowCount <= sampleSize) {
      const query = `SELECT * FROM ${qualifiedTable} LIMIT ${sampleSize}`;
      const result = await adapter.query(query, undefined, sampleSize);

      const columnSchemas: ColumnSchema[] = result.fields.map((field) => ({
        name: field.name,
        type: field.type,
        nullable: field.nullable,
        length: field.length,
        precision: field.precision,
        scale: field.scale,
      }));

      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        columnSchemas,
        sampledAt: startTime,
        samplingMethod: 'FULL_TABLE',
      };
    }

    // For larger tables, use TABLESAMPLE BERNOULLI for efficient random sampling
    const percentage = calculateSamplePercentage(sampleSize, table.rowCount);
    // Add explicit LIMIT to ensure we don't get more rows than requested
    const sampleQuery = `SELECT * FROM ${qualifiedTable} TABLESAMPLE BERNOULLI (${percentage}) LIMIT ${sampleSize}`;

    const result = await adapter.query(sampleQuery, undefined, sampleSize);

    const columnSchemas: ColumnSchema[] = result.fields.map((field) => ({
      name: field.name,
      type: field.type,
      nullable: field.nullable,
      length: field.length,
      precision: field.precision,
      scale: field.scale,
    }));

    return {
      tableId: `${table.database}.${table.schema}.${table.name}`,
      rowCount: table.rowCount,
      sampleSize: result.rows.length,
      sampleData: result.rows,
      columnSchemas,
      sampledAt: startTime,
      samplingMethod: 'TABLESAMPLE_BERNOULLI',
    };
  } catch (error) {
    // If TABLESAMPLE fails (shouldn't happen for tables), fall back to simple LIMIT
    try {
      const fallbackQuery = `SELECT * FROM ${qualifiedTable} LIMIT ${sampleSize}`;

      const result = await adapter.query(fallbackQuery, undefined, sampleSize);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        columnSchemas: result.fields.map((field) => ({
          name: field.name,
          type: field.type,
          nullable: field.nullable,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
        })),
        sampledAt: startTime,
        samplingMethod: 'LIMIT_FALLBACK',
      };
    } catch (_fallbackError) {
      throw new Error(
        `Failed to sample table ${qualifiedTable}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
