import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';

/**
 * Extract complete sample rows to show how columns relate to each other
 */
export class SampleRowsExtractor {
  constructor(private db: DuckDBManager) {}

  /**
   * Get complete sample rows from the table
   * Returns a small number of complete rows to show relationships between columns
   */
  async getSampleRows(limit = 5): Promise<Record<string, unknown>[]> {
    const sql = `
      SELECT *
      FROM ${this.db.getTableName()}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    try {
      const result = await this.db.query<Record<string, unknown>>(sql);

      // Process the rows to handle special types like dates
      return result.map((row) => {
        const processedRow: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(row)) {
          // Convert Date objects to ISO strings for JSON serialization
          if (value instanceof Date) {
            processedRow[key] = value.toISOString();
          } else if (value !== null && typeof value === 'object') {
            // For complex objects, try to stringify them
            try {
              processedRow[key] = JSON.stringify(value);
            } catch {
              processedRow[key] = String(value);
            }
          } else {
            processedRow[key] = value;
          }
        }

        return processedRow;
      });
    } catch (error) {
      logger.error('Failed to get sample rows', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get sample rows with specific ordering
   * Useful for showing first/last rows or rows ordered by a specific column
   */
  async getSampleRowsOrdered(
    orderBy?: string,
    orderDirection: 'ASC' | 'DESC' = 'ASC',
    limit = 5
  ): Promise<Record<string, unknown>[]> {
    const orderClause = orderBy ? `ORDER BY "${orderBy}" ${orderDirection}` : 'ORDER BY RANDOM()';

    const sql = `
      SELECT *
      FROM ${this.db.getTableName()}
      WHERE 1=1
      ${orderClause}
      LIMIT ${limit}
    `;

    try {
      const result = await this.db.query<Record<string, unknown>>(sql);

      // Process the rows to handle special types
      return result.map((row) => {
        const processedRow: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(row)) {
          if (value instanceof Date) {
            processedRow[key] = value.toISOString();
          } else if (value !== null && typeof value === 'object') {
            try {
              processedRow[key] = JSON.stringify(value);
            } catch {
              processedRow[key] = String(value);
            }
          } else {
            processedRow[key] = value;
          }
        }

        return processedRow;
      });
    } catch (error) {
      logger.error('Failed to get ordered sample rows', {
        orderBy,
        orderDirection,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get diverse sample rows
   * Attempts to get rows that showcase different patterns in the data
   */
  async getDiverseSampleRows(limit = 5): Promise<Record<string, unknown>[]> {
    try {
      // First, get the column names from the table
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${this.db.getTableName()}'
      `;

      const columns = await this.db.query<{ column_name: string }>(columnsQuery);
      const columnList = columns.map((c) => `"${c.column_name}"`).join(', ');

      // Use NTILE to divide the dataset into buckets and sample from each
      // This gives us better diversity than pure random sampling
      const sql = `
        WITH bucketed_data AS (
          SELECT *,
                 NTILE(${limit * 2}) OVER (ORDER BY RANDOM()) as bucket
          FROM ${this.db.getTableName()}
        ),
        sampled AS (
          SELECT ${columnList}
          FROM bucketed_data
          WHERE bucket <= ${limit}
          QUALIFY ROW_NUMBER() OVER (PARTITION BY bucket ORDER BY RANDOM()) = 1
        )
        SELECT *
        FROM sampled
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;

      const result = await this.db.query<Record<string, unknown>>(sql);

      // If the complex query fails or returns no results, fall back to simple random sampling
      if (!result || result.length === 0) {
        logger.warn('Diverse sampling returned no results, falling back to random sampling');
        return this.getSampleRows(limit);
      }

      // Process the rows
      return result.map((row) => {
        const processedRow: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(row)) {
          if (value instanceof Date) {
            processedRow[key] = value.toISOString();
          } else if (value !== null && typeof value === 'object') {
            try {
              processedRow[key] = JSON.stringify(value);
            } catch {
              processedRow[key] = String(value);
            }
          } else {
            processedRow[key] = value;
          }
        }

        return processedRow;
      });
    } catch (error) {
      logger.warn('Failed to get diverse sample rows, falling back to random sampling', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Fall back to simple random sampling
      return this.getSampleRows(limit);
    }
  }
}
