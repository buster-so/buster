import type { DatabaseAdapter } from '../../../adapters/base';
import type { TableMetadata, TableSample } from '../../types';
import { getQualifiedTableName } from '../../utils';

/**
 * Sample a MySQL table
 * MySQL doesn't have TABLESAMPLE, so we use ORDER BY RAND() with optimization techniques
 */
export async function getTableSample(
  adapter: DatabaseAdapter,
  table: TableMetadata,
  sampleSize: number
): Promise<TableSample> {
  const startTime = new Date();
  const qualifiedTable = getQualifiedTableName(table.database, table.schema, table.name, 'mysql');

  try {
    // For small tables, just fetch all rows
    if (table.rowCount <= sampleSize) {
      const query = `SELECT * FROM ${qualifiedTable} LIMIT ${sampleSize}`;
      const result = await adapter.query(query);

      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        sampledAt: startTime,
        samplingMethod: 'FULL_TABLE',
      };
    }

    // For medium tables (up to 1M rows), use ORDER BY RAND() with LIMIT
    if (table.rowCount <= 1_000_000) {
      const query = `
        SELECT * 
        FROM ${qualifiedTable}
        ORDER BY RAND()
        LIMIT ${sampleSize}
      `;

      const result = await adapter.query(query);

      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        sampledAt: startTime,
        samplingMethod: 'RANDOM_ORDER',
      };
    }

    // For large tables, use a more efficient sampling method
    // This uses a WHERE clause with RAND() to pre-filter rows before sorting
    // The multiplier ensures we get enough rows even with the random filter
    const sampleRate = Math.min(1, (sampleSize * 3) / table.rowCount);
    
    const optimizedQuery = `
      SELECT * FROM (
        SELECT * 
        FROM ${qualifiedTable}
        WHERE RAND() <= ${sampleRate}
        LIMIT ${sampleSize * 2}
      ) AS sample
      ORDER BY RAND()
      LIMIT ${sampleSize}
    `;

    const result = await adapter.query(optimizedQuery);

    // If we didn't get enough rows, fall back to simple ORDER BY RAND()
    if (result.rows.length < sampleSize * 0.9) {
      const fallbackQuery = `
        SELECT * 
        FROM ${qualifiedTable}
        ORDER BY RAND()
        LIMIT ${sampleSize}
      `;

      const fallbackResult = await adapter.query(fallbackQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: fallbackResult.rows.length,
        sampleData: fallbackResult.rows,
        sampledAt: startTime,
        samplingMethod: 'RANDOM_ORDER_FALLBACK',
      };
    }

    return {
      tableId: `${table.database}.${table.schema}.${table.name}`,
      rowCount: table.rowCount,
      sampleSize: result.rows.length,
      sampleData: result.rows,
      sampledAt: startTime,
      samplingMethod: 'RANDOM_FILTER_OPTIMIZED',
    };
  } catch (error) {
    // Last resort: simple LIMIT without randomization
    try {
      const fallbackQuery = `
        SELECT * 
        FROM ${qualifiedTable}
        LIMIT ${sampleSize}
      `;

      const result = await adapter.query(fallbackQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        sampledAt: startTime,
        samplingMethod: 'SIMPLE_LIMIT',
      };
    } catch (fallbackError) {
      throw new Error(
        `Failed to sample table ${qualifiedTable}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}