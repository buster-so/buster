import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { DistributionMetrics, TopValue } from './types';

/**
 * Analyze distribution characteristics of columns
 */
export class DistributionAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Get top N most frequent values in a column
   */
  async computeTopValues(column: string, limit = 20): Promise<TopValue[]> {
    const sql = `
      WITH value_counts AS (
        SELECT 
          "${column}" as value,
          COUNT(*) as cnt,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM ${this.db.getTableName()}
        GROUP BY "${column}"
      )
      SELECT 
        value,
        percentage,
        RANK() OVER (ORDER BY cnt DESC) as frequency_rank
      FROM value_counts
      ORDER BY frequency_rank
      LIMIT ${limit}
    `;

    try {
      const result = await this.db.query<{
        value: any;
        percentage: number;
        frequency_rank: number;
      }>(sql);

      return result.map((row) => ({
        value: row.value,
        percentage: row.percentage ?? 0,
        rank: row.frequency_rank ?? 0,
      }));
    } catch (error) {
      logger.warn(`Failed to compute top values for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Compute Shannon entropy for a column
   */
  async computeEntropy(column: string): Promise<number> {
    const sql = `
      WITH probs AS (
        SELECT 
          COUNT(*) * 1.0 / SUM(COUNT(*)) OVER() as p
        FROM ${this.db.getTableName()}
        GROUP BY "${column}"
      )
      SELECT 
        -SUM(p * LOG2(p + 1e-10)) as entropy
      FROM probs
    `;

    try {
      const result = await this.db.query<{ entropy: number }>(sql);
      return result[0]?.entropy ?? 0;
    } catch (error) {
      logger.warn(`Failed to compute entropy for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Compute Gini coefficient for a column
   */
  async computeGiniCoefficient(column: string): Promise<number> {
    const sql = `
      WITH ranked AS (
        SELECT 
          COUNT(*) as freq,
          ROW_NUMBER() OVER (ORDER BY COUNT(*)) as rank_num,
          SUM(COUNT(*)) OVER() as total
        FROM ${this.db.getTableName()}
        GROUP BY "${column}"
      ),
      with_max AS (
        SELECT 
          *,
          MAX(rank_num) OVER() as max_rank
        FROM ranked
      ),
      cumulative AS (
        SELECT 
          rank_num * 1.0 / max_rank as x,
          SUM(freq) OVER (ORDER BY rank_num) * 1.0 / total as y,
          LAG(rank_num * 1.0 / max_rank, 1, 0) OVER (ORDER BY rank_num) as prev_x
        FROM with_max
      )
      SELECT 
        1 - 2 * SUM(y * prev_x) as gini_coefficient
      FROM cumulative
    `;

    try {
      const result = await this.db.query<{ gini_coefficient: number }>(sql);
      return result[0]?.gini_coefficient ?? 0;
    } catch (error) {
      logger.warn(`Failed to compute Gini coefficient for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Batch compute distribution metrics for multiple columns
   */
  async batchComputeDistributions(columns: string[]): Promise<Map<string, DistributionMetrics>> {
    logger.log('Computing distribution metrics for columns', { columnCount: columns.length });

    const metrics = new Map<string, DistributionMetrics>();

    // Distribution metrics need to be computed per column
    // but we can parallelize the computation
    const promises = columns.map(async (col) => {
      try {
        const [topValues, entropy, giniCoefficient] = await Promise.all([
          this.computeTopValues(col),
          this.computeEntropy(col),
          this.computeGiniCoefficient(col),
        ]);

        metrics.set(col, {
          topValues,
          entropy,
          giniCoefficient,
        });
      } catch (error) {
        logger.warn(`Failed to compute distribution metrics for column ${col}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Set default values for failed column
        metrics.set(col, {
          topValues: [],
          entropy: 0,
          giniCoefficient: 0,
        });
      }
    });

    await Promise.all(promises);

    logger.log('Distribution metrics computed successfully', { columnsProcessed: columns.length });

    return metrics;
  }
}
