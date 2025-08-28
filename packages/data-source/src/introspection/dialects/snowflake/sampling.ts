import type { DatabaseAdapter } from '../../../adapters/base';
import type { TableMetadata, TableSample } from '../../types';
import { calculateSamplePercentage, getQualifiedTableName } from '../../utils';

/**
 * Sample a Snowflake table using SAMPLE clause
 * Snowflake supports efficient TABLESAMPLE for random sampling
 */
export async function getTableSample(
  adapter: DatabaseAdapter,
  table: TableMetadata,
  sampleSize: number
): Promise<TableSample> {
  const startTime = new Date();
  const qualifiedTable = getQualifiedTableName(table.database, table.schema, table.name, 'snowflake');

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

    // For larger tables, use Snowflake's SAMPLE clause
    // SAMPLE can use either row count or percentage
    // Using row count is more predictable for our use case
    const sampleQuery = `
      SELECT * 
      FROM ${qualifiedTable}
      SAMPLE (${sampleSize} ROWS)
      ORDER BY RANDOM()
    `;

    const result = await adapter.query(sampleQuery);

    // If SAMPLE didn't return enough rows (can happen with very skewed data),
    // fall back to TABLESAMPLE with percentage
    if (result.rows.length < sampleSize * 0.9) {
      // Less than 90% of requested
      const percentage = calculateSamplePercentage(sampleSize, table.rowCount);
      const fallbackQuery = `
        SELECT * 
        FROM ${qualifiedTable}
        TABLESAMPLE BERNOULLI (${percentage})
        ORDER BY RANDOM()
        LIMIT ${sampleSize}
      `;

      const fallbackResult = await adapter.query(fallbackQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: fallbackResult.rows.length,
        sampleData: fallbackResult.rows,
        sampledAt: startTime,
        samplingMethod: 'TABLESAMPLE_BERNOULLI',
      };
    }

    return {
      tableId: `${table.database}.${table.schema}.${table.name}`,
      rowCount: table.rowCount,
      sampleSize: result.rows.length,
      sampleData: result.rows,
      sampledAt: startTime,
      samplingMethod: 'SAMPLE_ROWS',
    };
  } catch (error) {
    // If sampling fails, try a simple LIMIT with ORDER BY RANDOM()
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