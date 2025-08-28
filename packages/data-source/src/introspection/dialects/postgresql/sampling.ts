import type { DatabaseAdapter } from '../../../adapters/base';
import type { TableMetadata, TableSample } from '../../types';
import { calculateSamplePercentage, getQualifiedTableName } from '../../utils';

/**
 * Sample a PostgreSQL table using TABLESAMPLE
 * PostgreSQL supports SYSTEM and BERNOULLI sampling methods
 */
export async function getTableSample(
  adapter: DatabaseAdapter,
  table: TableMetadata,
  sampleSize: number
): Promise<TableSample> {
  const startTime = new Date();
  const qualifiedTable = getQualifiedTableName(table.database, table.schema, table.name, 'postgresql');

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

    // For larger tables, use PostgreSQL's TABLESAMPLE
    // SYSTEM is faster but less random, BERNOULLI is slower but more random
    // We'll use SYSTEM for very large tables and BERNOULLI for medium tables
    const useBernoulli = table.rowCount < 10_000_000; // Use BERNOULLI for tables under 10M rows
    const samplingMethod = useBernoulli ? 'BERNOULLI' : 'SYSTEM';
    const percentage = calculateSamplePercentage(sampleSize * 1.2, table.rowCount); // Request 20% more to account for sampling variance

    const sampleQuery = `
      SELECT * 
      FROM ${qualifiedTable}
      TABLESAMPLE ${samplingMethod} (${percentage})
      LIMIT ${sampleSize}
    `;

    const result = await adapter.query(sampleQuery);

    // If we didn't get enough rows, try again with a higher percentage
    if (result.rows.length < sampleSize * 0.9) {
      const higherPercentage = Math.min(100, percentage * 2);
      const retryQuery = `
        SELECT * 
        FROM ${qualifiedTable}
        TABLESAMPLE BERNOULLI (${higherPercentage})
        LIMIT ${sampleSize}
      `;

      const retryResult = await adapter.query(retryQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: retryResult.rows.length,
        sampleData: retryResult.rows,
        sampledAt: startTime,
        samplingMethod: 'TABLESAMPLE_BERNOULLI_RETRY',
      };
    }

    return {
      tableId: `${table.database}.${table.schema}.${table.name}`,
      rowCount: table.rowCount,
      sampleSize: result.rows.length,
      sampleData: result.rows,
      sampledAt: startTime,
      samplingMethod: `TABLESAMPLE_${samplingMethod}`,
    };
  } catch (error) {
    // If TABLESAMPLE fails (e.g., on views or foreign tables), fall back to ORDER BY RANDOM()
    try {
      const fallbackQuery = `
        SELECT * 
        FROM ${qualifiedTable}
        ORDER BY RANDOM()
        LIMIT ${sampleSize}
      `;

      const result = await adapter.query(fallbackQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        sampledAt: startTime,
        samplingMethod: 'RANDOM_LIMIT',
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