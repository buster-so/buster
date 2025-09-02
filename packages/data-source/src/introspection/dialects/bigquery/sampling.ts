import type { DatabaseAdapter } from '../../../adapters/base';
import type { ColumnSchema, TableMetadata, TableSample } from '../../types';
import { calculateSamplePercentage, getQualifiedTableName } from '../../utils';

/**
 * Sample a BigQuery table using TABLESAMPLE
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
    'bigquery'
  );

  try {
    // For views, use RAND() filtering for pseudo-random sampling
    if (table.type === 'VIEW') {
      const maxViewSample = 500000;
      const viewSampleSize = Math.min(sampleSize, maxViewSample);

      // Try RAND() filtering for pseudo-random distribution
      try {
        // RAND() < 0.1 gives us ~10% sample
        const randomQuery = `
          SELECT * FROM ${qualifiedTable}
          WHERE RAND() < 0.1
          LIMIT ${viewSampleSize}
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
        // Random filtering failed or returned too few rows, fall through to simple LIMIT
      }

      // Fallback to simple LIMIT if random sampling fails
      const query = `SELECT * FROM ${qualifiedTable} LIMIT ${viewSampleSize}`;
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
      const query = `SELECT * FROM ${qualifiedTable} LIMIT ${sampleSize}`;
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

    // BigQuery supports TABLESAMPLE SYSTEM
    const percentage = calculateSamplePercentage(sampleSize * 1.2, table.rowCount);

    const sampleQuery = `
      SELECT * 
      FROM ${qualifiedTable}
      TABLESAMPLE SYSTEM (${percentage} PERCENT)
      LIMIT ${sampleSize}
    `;

    const result = await adapter.query(sampleQuery);

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
      samplingMethod: 'TABLESAMPLE_SYSTEM',
    };
  } catch (error) {
    // Fallback to ORDER BY RAND()
    try {
      const fallbackQuery = `
        SELECT * 
        FROM ${qualifiedTable}
        ORDER BY RAND()
        LIMIT ${sampleSize}
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
        samplingMethod: 'RANDOM_LIMIT',
      };
    } catch (fallbackError) {
      console.error(fallbackError);
      throw new Error(
        `Failed to sample table ${qualifiedTable}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
