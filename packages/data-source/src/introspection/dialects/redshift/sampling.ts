import type { DatabaseAdapter } from '../../../adapters/base';
import type { TableMetadata, TableSample } from '../../types';
import { getQualifiedTableName } from '../../utils';

/**
 * Sample a Redshift table
 * Redshift doesn't support TABLESAMPLE, so we use RANDOM() with optimization
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
    'redshift'
  );

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

    // For larger tables, use RANDOM() with LIMIT
    // Redshift optimizes ORDER BY RANDOM() better than most databases
    const sampleQuery = `
      SELECT * 
      FROM ${qualifiedTable}
      ORDER BY RANDOM()
      LIMIT ${sampleSize}
    `;

    const result = await adapter.query(sampleQuery);

    return {
      tableId: `${table.database}.${table.schema}.${table.name}`,
      rowCount: table.rowCount,
      sampleSize: result.rows.length,
      sampleData: result.rows,
      sampledAt: startTime,
      samplingMethod: 'RANDOM_ORDER',
    };
  } catch (error) {
    // Fallback to simple LIMIT without randomization
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
