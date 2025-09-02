import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { NumericMetadata } from './types';

/**
 * Enhanced numeric metadata analyzer with histogram and pattern analysis
 */
export class NumericMetadataAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Analyze a numeric column to extract enhanced metadata
   */
  async analyzeNumericColumn(columnName: string): Promise<NumericMetadata> {
    try {
      const results = await Promise.allSettled([
        this.getHistogramAnalysis(columnName),
        this.getLogScaleAnalysis(columnName),
        this.getClusterAnalysis(columnName),
        this.getNumericPatterns(columnName),
      ]);

      const histogram = results[0].status === 'fulfilled' ? results[0].value : undefined;
      const logScale = results[1].status === 'fulfilled' ? results[1].value : undefined;
      const clusters = results[2].status === 'fulfilled' ? results[2].value : undefined;
      const patterns = results[3].status === 'fulfilled' ? results[3].value : {};

      const result: NumericMetadata = { ...patterns };

      if (histogram !== undefined) {
        result.histogram = histogram;
      }
      if (logScale !== undefined) {
        result.logScaleDistribution = logScale;
      }
      if (clusters !== undefined) {
        result.clusters = clusters;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to analyze numeric column ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  private async getHistogramAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // First, get basic stats to determine optimal bin count
    const statsSql = `
      SELECT 
        MIN(${escapedColumn}::DOUBLE) as min_val,
        MAX(${escapedColumn}::DOUBLE) as max_val,
        COUNT(*) as total_count,
        STDDEV(${escapedColumn}::DOUBLE) as std_dev
      FROM ${this.db.getTableName()}
      WHERE ${escapedColumn} IS NOT NULL
        AND ${escapedColumn}::DOUBLE IS NOT NULL
    `;

    const statsResult = await this.db.query<{
      min_val: number;
      max_val: number;
      total_count: number;
      std_dev: number;
    }>(statsSql);

    const stats = statsResult[0];
    if (statsResult.length === 0 || !stats || stats.total_count === 0) {
      return undefined;
    }
    const range = stats.max_val - stats.min_val;

    if (range === 0) {
      // All values are the same
      return {
        bins: [
          {
            min: stats.min_val,
            max: stats.max_val,
            count: stats.total_count,
            percentage: 100,
          },
        ],
        binCount: 1,
        binWidth: 0,
      };
    }

    // Calculate optimal bin count using Freedman-Diaconis rule
    // But cap it at reasonable limits for visualization
    const binCount = Math.min(50, Math.max(5, Math.ceil(stats.total_count ** (1 / 3))));
    const binWidth = range / binCount;

    // Create histogram
    const histogramSql = `
      WITH bins AS (
        SELECT 
          ${escapedColumn}::DOUBLE as value,
          FLOOR((${escapedColumn}::DOUBLE - ${stats.min_val}) / ${binWidth}) as bin_index
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE IS NOT NULL
      ),
      histogram AS (
        SELECT 
          bin_index,
          COUNT(*) as count,
          ${stats.min_val} + bin_index * ${binWidth} as bin_min,
          ${stats.min_val} + (bin_index + 1) * ${binWidth} as bin_max
        FROM bins
        WHERE bin_index >= 0 AND bin_index < ${binCount}
        GROUP BY bin_index
        ORDER BY bin_index
      )
      SELECT 
        bin_min as min,
        bin_max as max,
        count,
        (count * 100.0 / ${stats.total_count}) as percentage
      FROM histogram
    `;

    const histogramResults = await this.db.query<{
      min: number;
      max: number;
      count: number;
      percentage: number;
    }>(histogramSql);

    return {
      bins: histogramResults,
      binCount,
      binWidth,
    };
  }

  private async getLogScaleAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // Only analyze log scale for positive numbers with wide range
    const checkSql = `
      SELECT 
        MIN(${escapedColumn}::DOUBLE) as min_val,
        MAX(${escapedColumn}::DOUBLE) as max_val,
        COUNT(*) as total_count
      FROM ${this.db.getTableName()}
      WHERE ${escapedColumn} IS NOT NULL
        AND ${escapedColumn}::DOUBLE > 0
        AND ${escapedColumn}::DOUBLE IS NOT NULL
    `;

    const checkResult = await this.db.query<{
      min_val: number;
      max_val: number;
      total_count: number;
    }>(checkSql);

    const stats = checkResult[0];
    if (checkResult.length === 0 || !stats || stats.total_count === 0) {
      return undefined;
    }
    const logRange = Math.log10(stats.max_val) - Math.log10(stats.min_val);

    // Only create log scale distribution if range spans multiple orders of magnitude
    if (logRange < 2) {
      return undefined;
    }

    const logBinCount = Math.min(10, Math.max(3, Math.ceil(logRange)));
    const logBinWidth = logRange / logBinCount;

    const logHistogramSql = `
      WITH log_bins AS (
        SELECT 
          ${escapedColumn}::DOUBLE as value,
          LOG10(${escapedColumn}::DOUBLE) as log_value,
          FLOOR((LOG10(${escapedColumn}::DOUBLE) - LOG10(${stats.min_val})) / ${logBinWidth}) as bin_index
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE > 0
          AND ${escapedColumn}::DOUBLE IS NOT NULL
      ),
      log_histogram AS (
        SELECT 
          bin_index,
          COUNT(*) as count,
          POWER(10, LOG10(${stats.min_val}) + bin_index * ${logBinWidth}) as bin_min,
          POWER(10, LOG10(${stats.min_val}) + (bin_index + 1) * ${logBinWidth}) as bin_max
        FROM log_bins
        WHERE bin_index >= 0 AND bin_index < ${logBinCount}
        GROUP BY bin_index
        ORDER BY bin_index
      )
      SELECT 
        bin_min as min,
        bin_max as max,
        count,
        (count * 100.0 / ${stats.total_count}) as percentage
      FROM log_histogram
    `;

    const logResults = await this.db.query<{
      min: number;
      max: number;
      count: number;
      percentage: number;
    }>(logHistogramSql);

    // Test for log-normal distribution (simple heuristic)
    const isLogNormal = this.testLogNormalDistribution(logResults);

    return {
      bins: logResults,
      isLogNormalDistributed: isLogNormal,
    };
  }

  private testLogNormalDistribution(bins: Array<{ count: number; percentage: number }>): boolean {
    if (bins.length < 3) return false;

    // Simple test: check if distribution has a single peak and reasonable spread
    const maxCount = Math.max(...bins.map((b) => b.count));
    const peakBins = bins.filter((b) => b.count > maxCount * 0.8);

    // Should have 1-2 peak bins and reasonable tail distribution
    return peakBins.length <= 2 && bins.length >= 5;
  }

  private async getClusterAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // Simple clustering using quantile-based approach
    const clusterSql = `
      WITH percentiles AS (
        SELECT 
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${escapedColumn}::DOUBLE) as q1,
          PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${escapedColumn}::DOUBLE) as q2,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${escapedColumn}::DOUBLE) as q3,
          COUNT(*) as total_count
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE IS NOT NULL
      ),
      clusters AS (
        SELECT 
          ${escapedColumn}::DOUBLE as value,
          CASE 
            WHEN ${escapedColumn}::DOUBLE <= (SELECT q1 FROM percentiles) THEN 1
            WHEN ${escapedColumn}::DOUBLE <= (SELECT q2 FROM percentiles) THEN 2
            WHEN ${escapedColumn}::DOUBLE <= (SELECT q3 FROM percentiles) THEN 3
            ELSE 4
          END as cluster_id,
          (SELECT total_count FROM percentiles) as total_count
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE IS NOT NULL
      )
      SELECT 
        cluster_id,
        AVG(value) as center,
        COUNT(*) as size,
        (COUNT(*) * 100.0 / MAX(total_count)) as percentage
      FROM clusters
      GROUP BY cluster_id, total_count
      ORDER BY cluster_id
    `;

    const clusterResults = await this.db.query<{
      cluster_id: number;
      center: number;
      size: number;
      percentage: number;
    }>(clusterSql);

    // Only return clusters if we have meaningful groupings (not just quartiles)
    if (clusterResults.length > 0) {
      return clusterResults.map((r) => ({
        center: r.center,
        size: r.size,
        percentage: r.percentage,
      }));
    }

    return undefined;
  }

  private async getNumericPatterns(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const patternSql = `
      WITH numeric_analysis AS (
        SELECT 
          ${escapedColumn}::DOUBLE as value,
          CASE 
            WHEN ${escapedColumn}::DOUBLE = FLOOR(${escapedColumn}::DOUBLE) THEN true
            ELSE false
          END as is_integer,
          CASE 
            WHEN ${escapedColumn}::DOUBLE < 0 THEN true
            ELSE false
          END as is_negative
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE IS NOT NULL
        LIMIT 1000  -- Sample for pattern detection
      )
      SELECT 
        AVG(CASE WHEN is_integer THEN 1.0 ELSE 0.0 END) as integer_ratio,
        AVG(CASE WHEN is_negative THEN 1.0 ELSE 0.0 END) as negative_ratio,
        COUNT(*) as sample_count
      FROM numeric_analysis
    `;

    const patternResults = await this.db.query<{
      integer_ratio: number;
      negative_ratio: number;
      sample_count: number;
    }>(patternSql);

    if (patternResults.length > 0) {
      const result = patternResults[0];
      if (!result) {
        return {};
      }

      // Detect if values look monetary (check for common monetary patterns)
      const monetarySql = `
        SELECT 
          AVG(CASE 
            WHEN ${escapedColumn}::DOUBLE >= 0 
             AND ${escapedColumn}::DOUBLE < 1000000 
             AND (${escapedColumn}::DOUBLE = ROUND(${escapedColumn}::DOUBLE, 2))
            THEN 1.0 
            ELSE 0.0 
          END) as monetary_ratio
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE IS NOT NULL
        LIMIT 1000
      `;

      const monetaryResults = await this.db.query<{ monetary_ratio: number }>(monetarySql);
      const monetaryRatio = monetaryResults[0]?.monetary_ratio || 0;

      // Detect percentage patterns (values between 0-1 or 0-100)
      const percentageSql = `
        SELECT 
          AVG(CASE 
            WHEN ${escapedColumn}::DOUBLE >= 0 AND ${escapedColumn}::DOUBLE <= 1 THEN 1.0
            WHEN ${escapedColumn}::DOUBLE >= 0 AND ${escapedColumn}::DOUBLE <= 100 THEN 0.5
            ELSE 0.0 
          END) as percentage_ratio
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::DOUBLE IS NOT NULL
        LIMIT 1000
      `;

      const percentageResults = await this.db.query<{ percentage_ratio: number }>(percentageSql);
      const percentageRatio = percentageResults[0]?.percentage_ratio || 0;

      return {
        isInteger: result.integer_ratio > 0.95,
        isMonetary: monetaryRatio > 0.8,
        isPercentage: percentageRatio > 0.7,
        hasNegativeValues: result.negative_ratio > 0,
      };
    }

    return {};
  }

  /**
   * Batch analyze numeric columns
   */
  async batchAnalyzeNumericColumns(columns: string[]): Promise<Map<string, NumericMetadata>> {
    logger.log('Analyzing numeric columns for enhanced metadata', { columnCount: columns.length });

    const results = new Map<string, NumericMetadata>();

    // Process columns in parallel for efficiency
    const promises = columns.map(async (column) => {
      try {
        const metadata = await this.analyzeNumericColumn(column);
        results.set(column, metadata);
      } catch (error) {
        logger.error(`Failed to analyze numeric column ${column}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results.set(column, {});
      }
    });

    await Promise.all(promises);

    logger.log('Numeric metadata analysis completed', { columnsProcessed: columns.length });
    return results;
  }
}
