import type { DatabaseAdapter } from '../../../adapters/base';
import type { ColumnSchema, TableMetadata, TableSample } from '../../types';
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
    // For views, use NEWID() for pseudo-random sampling
    if (table.type === 'VIEW') {
      const maxViewSample = 500000;
      const viewSampleSize = Math.min(sampleSize, maxViewSample);

      // Try using CHECKSUM(NEWID()) for pseudo-random distribution
      try {
        // ABS(CHECKSUM(NEWID())) % 10 = 0 gives us ~10% sample
        const randomQuery = `
          SELECT TOP ${viewSampleSize} * FROM ${qualifiedTable}
          WHERE ABS(CHECKSUM(NEWID())) % 10 = 0
        `;

        const result = await adapter.query(randomQuery);

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
            samplingMethod: 'VIEW_RANDOM_FILTER',
          };
        }
      } catch {
        // Random filtering failed or returned too few rows, fall through to simple TOP
      }

      // Fallback to simple TOP if random sampling fails
      const query = `SELECT TOP ${viewSampleSize} * FROM ${qualifiedTable}`;
      const result = await adapter.query(query);

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
      const query = `SELECT TOP ${sampleSize} * FROM ${qualifiedTable}`;
      const result = await adapter.query(query);

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
        columnSchemas: fallbackResult.fields.map((field) => ({
          name: field.name,
          type: field.type,
          nullable: field.nullable,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
        })),
        sampledAt: startTime,
        samplingMethod: 'NEWID_RANDOM',
      };
    }

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
        columnSchemas: result.fields.map((field) => ({
          name: field.name,
          type: field.type,
          nullable: field.nullable,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
        })),
        sampledAt: startTime,
        samplingMethod: 'SIMPLE_TOP',
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
