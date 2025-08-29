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
  async computeTopValues(column: string, limit = 10): Promise<TopValue[]> {
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
        cnt as count,
        percentage
      FROM value_counts
      ORDER BY cnt DESC
      LIMIT ${limit}
    `;

    try {
      const result = await this.db.query<{
        value: unknown;
        count: number;
        percentage: number;
      }>(sql);

      return result.map((row) => ({
        value: row.value,
        count: row.count ?? 0,
        percentage: row.percentage ?? 0,
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
        -SUM(CASE WHEN p > 0 THEN p * LOG2(p) ELSE 0 END) as entropy
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
      WITH value_counts AS (
        SELECT 
          COUNT(*) as freq
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
        GROUP BY "${column}"
      ),
      sorted_freq AS (
        SELECT 
          freq,
          ROW_NUMBER() OVER (ORDER BY freq ASC) as rank_idx,
          COUNT(*) OVER () as n
        FROM value_counts
      ),
      gini_calc AS (
        SELECT 
          n,
          SUM(freq * (2 * rank_idx - n - 1)) as numerator,
          SUM(freq) * n as denominator
        FROM sorted_freq
        GROUP BY n
      )
      SELECT 
        CASE 
          WHEN n <= 1 OR denominator = 0 THEN 0
          ELSE numerator * 1.0 / denominator
        END as gini_coefficient
      FROM gini_calc
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
