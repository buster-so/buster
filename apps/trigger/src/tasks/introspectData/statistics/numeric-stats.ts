import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { NumericStatistics } from './types';

/**
 * Analyze numeric columns with statistical measures
 */
export class NumericStatsAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Check if a column is numeric
   */
  async isNumericColumn(_column: string, dataType: string): Promise<boolean> {
    const numericTypes = ['INTEGER', 'BIGINT', 'DOUBLE', 'FLOAT', 'DECIMAL', 'NUMERIC', 'REAL'];
    return numericTypes.some((type) => dataType.toUpperCase().includes(type));
  }

  /**
   * Compute descriptive statistics for a numeric column
   */
  async computeDescriptiveStats(
    column: string
  ): Promise<Pick<NumericStatistics, 'mean' | 'median' | 'stdDev'>> {
    const sql = `
      SELECT 
        AVG(CAST("${column}" AS DOUBLE)) as mean,
        MEDIAN(CAST("${column}" AS DOUBLE)) as median,
        STDDEV(CAST("${column}" AS DOUBLE)) as std_dev
      FROM ${this.db.getTableName()}
      WHERE "${column}" IS NOT NULL
    `;

    try {
      const result = await this.db.query<{
        mean: number | string;
        median: number | string;
        std_dev: number | string;
      }>(sql);

      // Helper to handle potential string values from DuckDB
      const toNumber = (value: number | string | undefined): number => {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'number') return value;
        if (value === 'Infinity') return Number.POSITIVE_INFINITY;
        if (value === '-Infinity') return Number.NEGATIVE_INFINITY;
        if (value === 'NaN') return 0;
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      return {
        mean: toNumber(result[0]?.mean),
        median: toNumber(result[0]?.median),
        stdDev: toNumber(result[0]?.std_dev),
      };
    } catch (error) {
      logger.warn(`Failed to compute descriptive stats for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return { mean: 0, median: 0, stdDev: 0 };
    }
  }

  /**
   * Compute percentiles for a numeric column
   */
  async computePercentiles(column: string): Promise<NumericStatistics['percentiles']> {
    const sql = `
      SELECT 
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY CAST("${column}" AS DOUBLE)) as p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CAST("${column}" AS DOUBLE)) as p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CAST("${column}" AS DOUBLE)) as p75,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST("${column}" AS DOUBLE)) as p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY CAST("${column}" AS DOUBLE)) as p99
      FROM ${this.db.getTableName()}
      WHERE "${column}" IS NOT NULL
    `;

    try {
      const result = await this.db.query<{
        p25: number | string;
        p50: number | string;
        p75: number | string;
        p95: number | string;
        p99: number | string;
      }>(sql);

      // Helper to handle potential string values from DuckDB
      const toNumber = (value: number | string | undefined): number => {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'number') return value;
        if (value === 'Infinity') return Number.POSITIVE_INFINITY;
        if (value === '-Infinity') return Number.NEGATIVE_INFINITY;
        if (value === 'NaN') return 0;
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      return {
        p25: toNumber(result[0]?.p25),
        p50: toNumber(result[0]?.p50),
        p75: toNumber(result[0]?.p75),
        p95: toNumber(result[0]?.p95),
        p99: toNumber(result[0]?.p99),
      };
    } catch (error) {
      logger.warn(`Failed to compute percentiles for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return { p25: 0, p50: 0, p75: 0, p95: 0, p99: 0 };
    }
  }

  /**
   * Compute skewness for a numeric column
   */
  async computeSkewness(column: string): Promise<number> {
    const sql = `
      SELECT SKEWNESS(CAST("${column}" AS DOUBLE)) as skewness 
      FROM ${this.db.getTableName()}
      WHERE "${column}" IS NOT NULL
    `;

    try {
      const result = await this.db.query<{ skewness: number | string }>(sql);
      const skewnessValue = result[0]?.skewness;

      // Handle special values that DuckDB might return as strings
      if (typeof skewnessValue === 'string') {
        if (skewnessValue === 'Infinity') return Number.POSITIVE_INFINITY;
        if (skewnessValue === '-Infinity') return Number.NEGATIVE_INFINITY;
        if (skewnessValue === 'NaN') return 0;
        // Try to parse as number if it's a numeric string
        const parsed = Number.parseFloat(skewnessValue);
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      return skewnessValue ?? 0;
    } catch (error) {
      logger.warn(`Failed to compute skewness for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Compute outlier rate (values beyond 3 standard deviations)
   */
  async computeOutlierRate(column: string): Promise<number> {
    const sql = `
      WITH stats AS (
        SELECT 
          AVG(CAST("${column}" AS DOUBLE)) as mean, 
          STDDEV(CAST("${column}" AS DOUBLE)) as stddev
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
      )
      SELECT 
        SUM(CASE 
          WHEN ABS(CAST("${column}" AS DOUBLE) - stats.mean) > 2.5 * stats.stddev THEN 1 
          ELSE 0 
        END) * 1.0 / COUNT(*) as outlier_rate
      FROM ${this.db.getTableName()}, stats
      WHERE "${column}" IS NOT NULL
    `;

    try {
      const result = await this.db.query<{ outlier_rate: number | string }>(sql);
      const outlierRateValue = result[0]?.outlier_rate;

      // Handle potential string values from DuckDB
      if (typeof outlierRateValue === 'string') {
        if (outlierRateValue === 'Infinity') return 1; // Cap at 100%
        if (outlierRateValue === '-Infinity') return 0;
        if (outlierRateValue === 'NaN') return 0;
        const parsed = Number.parseFloat(outlierRateValue);
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      return outlierRateValue ?? 0;
    } catch (error) {
      logger.warn(`Failed to compute outlier rate for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Compute all numeric statistics for a column
   */
  async computeNumericStats(column: string): Promise<NumericStatistics> {
    try {
      const [descriptive, percentiles, skewness, outlierRate] = await Promise.all([
        this.computeDescriptiveStats(column),
        this.computePercentiles(column),
        this.computeSkewness(column),
        this.computeOutlierRate(column),
      ]);

      return {
        ...descriptive,
        percentiles,
        skewness,
        outlierRate,
      };
    } catch (error) {
      logger.error(`Failed to compute numeric stats for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // Return default values
      return {
        mean: 0,
        median: 0,
        stdDev: 0,
        skewness: 0,
        percentiles: { p25: 0, p50: 0, p75: 0, p95: 0, p99: 0 },
        outlierRate: 0,
      };
    }
  }

  /**
   * Batch compute numeric statistics for multiple columns
   */
  async batchComputeNumericStats(
    columns: Array<{ name: string; type: string }>
  ): Promise<Map<string, NumericStatistics>> {
    logger.log('Computing numeric statistics', { columnCount: columns.length });

    const stats = new Map<string, NumericStatistics>();

    // Filter to numeric columns
    const numericColumns = [];
    for (const col of columns) {
      if (await this.isNumericColumn(col.name, col.type)) {
        numericColumns.push(col.name);
      }
    }

    logger.log('Identified numeric columns', { numericCount: numericColumns.length });

    // Compute stats in parallel
    const promises = numericColumns.map(async (col) => {
      const numStats = await this.computeNumericStats(col);
      stats.set(col, numStats);
    });

    await Promise.all(promises);

    logger.log('Numeric statistics computed successfully', {
      columnsProcessed: numericColumns.length,
    });

    return stats;
  }
}
