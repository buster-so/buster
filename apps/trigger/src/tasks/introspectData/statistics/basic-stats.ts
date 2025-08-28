import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { BasicStats } from './types';

/**
 * Compute basic statistics for columns
 */
export class BasicStatsAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Compute null rate for a column
   */
  async computeNullRate(column: string): Promise<number> {
    const sql = `
      SELECT 
        SUM(CASE WHEN "${column}" IS NULL THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as null_rate
      FROM ${this.db.getTableName()}
    `;

    const result = await this.db.query<{ null_rate: number }>(sql);
    return result[0]?.null_rate ?? 0;
  }

  /**
   * Compute distinct count for a column
   */
  async computeDistinctCount(column: string): Promise<number> {
    const sql = `
      SELECT COUNT(DISTINCT "${column}") as distinct_count 
      FROM ${this.db.getTableName()}
    `;

    const result = await this.db.query<{ distinct_count: number }>(sql);
    return result[0]?.distinct_count ?? 0;
  }

  /**
   * Compute uniqueness ratio for a column
   */
  async computeUniquenessRatio(column: string): Promise<number> {
    const sql = `
      SELECT 
        COUNT(DISTINCT "${column}") * 1.0 / COUNT(*) as uniqueness_ratio
      FROM ${this.db.getTableName()}
    `;

    const result = await this.db.query<{ uniqueness_ratio: number }>(sql);
    return result[0]?.uniqueness_ratio ?? 0;
  }

  /**
   * Compute empty string rate for a column
   * Note: This should only be called for text-based columns
   */
  async computeEmptyStringRate(column: string): Promise<number> {
    const sql = `
      SELECT 
        SUM(CASE WHEN "${column}" = '' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as empty_string_rate
      FROM ${this.db.getTableName()}
    `;

    try {
      const result = await this.db.query<{ empty_string_rate: number }>(sql);
      return result[0]?.empty_string_rate ?? 0;
    } catch (error) {
      // If type conversion fails, return 0
      logger.warn(`Failed to compute empty string rate for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Batch compute basic statistics for multiple columns with type awareness
   * More efficient than individual queries
   */
  async batchComputeBasicStats(
    columnMetadata: Array<{ name: string; type: string }>
  ): Promise<Map<string, BasicStats>> {
    logger.log('Computing basic statistics for columns', { columnCount: columnMetadata.length });

    const stats = new Map<string, BasicStats>();

    if (columnMetadata.length === 0) {
      return stats;
    }

    try {
      // Build a single query to compute all basic stats for all columns
      const selectClauses = columnMetadata.flatMap((col) => {
        const escapedCol = `"${col.name}"`;
        const clauses = [
          `SUM(CASE WHEN ${escapedCol} IS NULL THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as "${col.name}_null_rate"`,
          `COUNT(DISTINCT ${escapedCol}) as "${col.name}_distinct_count"`,
          `COUNT(DISTINCT ${escapedCol}) * 1.0 / COUNT(*) as "${col.name}_uniqueness_ratio"`,
        ];

        // Only check for empty strings on text-based columns
        const isTextType = ['VARCHAR', 'TEXT', 'STRING', 'CHAR'].some((textType) =>
          col.type.toUpperCase().includes(textType)
        );

        if (isTextType) {
          clauses.push(
            `SUM(CASE WHEN ${escapedCol} = '' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as "${col.name}_empty_rate"`
          );
        } else {
          // For non-text columns, set empty rate to 0
          clauses.push(`0 as "${col.name}_empty_rate"`);
        }

        return clauses;
      });

      const sql = `
        SELECT 
          ${selectClauses.join(',\n          ')}
        FROM ${this.db.getTableName()}
      `;

      const result = await this.db.query(sql);

      if (result.length > 0) {
        const row = result[0];

        for (const col of columnMetadata) {
          stats.set(col.name, {
            nullRate: row[`${col.name}_null_rate`] ?? 0,
            distinctCount: row[`${col.name}_distinct_count`] ?? 0,
            uniquenessRatio: row[`${col.name}_uniqueness_ratio`] ?? 0,
            emptyStringRate: row[`${col.name}_empty_rate`] ?? 0,
          });
        }
      }

      logger.log('Basic statistics computed successfully', {
        columnsProcessed: columnMetadata.length,
      });
    } catch (error) {
      logger.error('Error computing basic statistics', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to individual queries if batch fails
      for (const col of columnMetadata) {
        try {
          const isTextType = ['VARCHAR', 'TEXT', 'STRING', 'CHAR'].some((textType) =>
            col.type.toUpperCase().includes(textType)
          );

          stats.set(col.name, {
            nullRate: await this.computeNullRate(col.name),
            distinctCount: await this.computeDistinctCount(col.name),
            uniquenessRatio: await this.computeUniquenessRatio(col.name),
            emptyStringRate: isTextType ? await this.computeEmptyStringRate(col.name) : 0,
          });
        } catch (colError) {
          logger.warn(`Failed to compute stats for column ${col.name}`, {
            error: colError instanceof Error ? colError.message : String(colError),
          });

          // Set default values for failed column
          stats.set(col.name, {
            nullRate: 0,
            distinctCount: 0,
            uniquenessRatio: 0,
            emptyStringRate: 0,
          });
        }
      }
    }

    return stats;
  }
}
