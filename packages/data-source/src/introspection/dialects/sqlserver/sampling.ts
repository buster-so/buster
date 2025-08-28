import type { DatabaseAdapter } from '../../../adapters/base';
import type { TableMetadata, TableSample } from '../../types';
import { calculateSamplePercentage, getQualifiedTableName } from '../../utils';

/**
 * Sample a SQL Server table using TABLESAMPLE
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
    'sqlserver'
  );

  try {
    // For small tables, just fetch all rows
    if (table.rowCount <= sampleSize) {
      const query = `SELECT TOP ${sampleSize} * FROM ${qualifiedTable}`;
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

    // SQL Server supports TABLESAMPLE with percentage or rows
    // Using percentage for consistency
    const percentage = calculateSamplePercentage(sampleSize * 1.2, table.rowCount);

    const sampleQuery = `
      SELECT TOP ${sampleSize} *
      FROM ${qualifiedTable}
      TABLESAMPLE (${percentage} PERCENT)
    `;

    const result = await adapter.query(sampleQuery);

    // If we didn't get enough rows, try with NEWID() for randomization
    if (result.rows.length < sampleSize * 0.9) {
      const fallbackQuery = `
        SELECT TOP ${sampleSize} *
        FROM ${qualifiedTable}
        ORDER BY NEWID()
      `;

      const fallbackResult = await adapter.query(fallbackQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: fallbackResult.rows.length,
        sampleData: fallbackResult.rows,
        sampledAt: startTime,
        samplingMethod: 'NEWID_RANDOM',
      };
    }

    return {
      tableId: `${table.database}.${table.schema}.${table.name}`,
      rowCount: table.rowCount,
      sampleSize: result.rows.length,
      sampleData: result.rows,
      sampledAt: startTime,
      samplingMethod: 'TABLESAMPLE',
    };
  } catch (error) {
    // Fallback to simple TOP without randomization
    try {
      const fallbackQuery = `
        SELECT TOP ${sampleSize} *
        FROM ${qualifiedTable}
      `;

      const result = await adapter.query(fallbackQuery);
      return {
        tableId: `${table.database}.${table.schema}.${table.name}`,
        rowCount: table.rowCount,
        sampleSize: result.rows.length,
        sampleData: result.rows,
        sampledAt: startTime,
        samplingMethod: 'SIMPLE_TOP',
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
