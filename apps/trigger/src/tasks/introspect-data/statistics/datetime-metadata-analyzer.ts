import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { DateTimeMetadata } from './types';

/**
 * Analyzes datetime columns to extract temporal patterns and distributions
 */
export class DateTimeMetadataAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Analyze a datetime column and extract rich temporal metadata
   */
  async analyzeDateTimeColumn(columnName: string): Promise<DateTimeMetadata> {
    try {
      const results = await Promise.allSettled([
        this.getTemporalDistributions(columnName),
        this.getDateRangeAnalysis(columnName),
        this.getRecencyDistribution(columnName),
        this.getPatternAnalysis(columnName),
      ]);

      const temporalDistributions = results[0].status === 'fulfilled' ? results[0].value : {};
      const dateRange = results[1].status === 'fulfilled' ? results[1].value : {};
      const recency = results[2].status === 'fulfilled' ? results[2].value : undefined;
      const patterns = results[3].status === 'fulfilled' ? results[3].value : {};

      const result: DateTimeMetadata = {
        ...temporalDistributions,
        ...dateRange,
        ...patterns,
      };

      if (recency !== undefined) {
        result.recencyDistribution = recency;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to analyze datetime column ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  private async getTemporalDistributions(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const sql = `
      WITH date_parts AS (
        SELECT 
          ${escapedColumn}::TIMESTAMP as dt,
          EXTRACT(YEAR FROM ${escapedColumn}::TIMESTAMP) as year,
          EXTRACT(MONTH FROM ${escapedColumn}::TIMESTAMP) as month,
          EXTRACT(QUARTER FROM ${escapedColumn}::TIMESTAMP) as quarter,
          EXTRACT(DOW FROM ${escapedColumn}::TIMESTAMP) as dow
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
      )
      SELECT 
        'year' as dist_type,
        CAST(year AS VARCHAR) as value,
        COUNT(*) as count
      FROM date_parts
      GROUP BY year
      
      UNION ALL
      
      SELECT 
        'month' as dist_type,
        CAST(month AS VARCHAR) as value,
        COUNT(*) as count
      FROM date_parts
      GROUP BY month
      
      UNION ALL
      
      SELECT 
        'quarter' as dist_type,
        CAST(quarter AS VARCHAR) as value,
        COUNT(*) as count
      FROM date_parts
      GROUP BY quarter
      
      UNION ALL
      
      SELECT 
        'day_of_week' as dist_type,
        CASE dow
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as value,
        COUNT(*) as count
      FROM date_parts
      GROUP BY dow
      
      ORDER BY dist_type, value
    `;

    const results = await this.db.query<{
      dist_type: string;
      value: string;
      count: number;
    }>(sql);

    const distributions: Partial<DateTimeMetadata> = {};

    for (const result of results) {
      switch (result.dist_type) {
        case 'year':
          distributions.yearDistribution = distributions.yearDistribution || {};
          distributions.yearDistribution[result.value] = result.count;
          break;
        case 'month':
          distributions.monthDistribution = distributions.monthDistribution || {};
          distributions.monthDistribution[result.value] = result.count;
          break;
        case 'quarter':
          distributions.quarterDistribution = distributions.quarterDistribution || {};
          distributions.quarterDistribution[result.value] = result.count;
          break;
        case 'day_of_week':
          distributions.dayOfWeekDistribution = distributions.dayOfWeekDistribution || {};
          distributions.dayOfWeekDistribution[result.value] = result.count;
          break;
      }
    }

    return distributions;
  }

  private async getDateRangeAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const sql = `
      SELECT 
        MIN(${escapedColumn}::TIMESTAMP) as min_date,
        MAX(${escapedColumn}::TIMESTAMP) as max_date,
        EXTRACT(EPOCH FROM (MAX(${escapedColumn}::TIMESTAMP) - MIN(${escapedColumn}::TIMESTAMP))) / 86400 as range_days
      FROM ${this.db.getTableName()}
      WHERE ${escapedColumn} IS NOT NULL
    `;

    const result = await this.db.query<{
      min_date: string;
      max_date: string;
      range_days: number;
    }>(sql);

    if (result.length > 0) {
      const firstResult = result[0];
      if (firstResult) {
        return {
          minDate: firstResult.min_date,
          maxDate: firstResult.max_date,
          dateRange: Math.round(firstResult.range_days),
        };
      }
    }

    return {};
  }

  private async getRecencyDistribution(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const sql = `
      WITH recency_buckets AS (
        SELECT 
          ${escapedColumn}::TIMESTAMP as dt,
          CASE 
            WHEN ${escapedColumn}::TIMESTAMP >= CURRENT_DATE - INTERVAL 7 DAYS THEN 'veryRecent'
            WHEN ${escapedColumn}::TIMESTAMP >= CURRENT_DATE - INTERVAL 30 DAYS THEN 'recent'
            WHEN ${escapedColumn}::TIMESTAMP >= CURRENT_DATE - INTERVAL 90 DAYS THEN 'moderate'
            ELSE 'old'
          END as recency_bucket
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
      )
      SELECT 
        recency_bucket,
        COUNT(*) as count
      FROM recency_buckets
      GROUP BY recency_bucket
    `;

    try {
      const results = await this.db.query<{
        recency_bucket: 'veryRecent' | 'recent' | 'moderate' | 'old';
        count: number;
      }>(sql);

      const distribution = {
        veryRecent: 0,
        recent: 0,
        moderate: 0,
        old: 0,
      };

      for (const result of results) {
        distribution[result.recency_bucket] = result.count;
      }

      return distribution;
    } catch (error) {
      // If current date operations fail, skip recency analysis
      logger.warn(`Failed to compute recency distribution for ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private async getPatternAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // Check for time component and common patterns
    const sql = `
      WITH pattern_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as str_value,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%:%' THEN true
            ELSE false
          END as has_time_component,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%+%' OR ${escapedColumn}::VARCHAR LIKE '%-%' THEN true
            ELSE false
          END as has_timezone_indicator
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        AVG(CASE WHEN has_time_component THEN 1.0 ELSE 0.0 END) as time_component_ratio,
        AVG(CASE WHEN has_timezone_indicator THEN 1.0 ELSE 0.0 END) as timezone_ratio,
        COUNT(*) as sample_count
      FROM pattern_analysis
    `;

    const results = await this.db.query<{
      time_component_ratio: number;
      timezone_ratio: number;
      sample_count: number;
    }>(sql);

    if (results.length > 0) {
      const result = results[0];

      // Get common format examples
      const formatSql = `
        SELECT 
          ${escapedColumn}::VARCHAR as example,
          COUNT(*) as frequency
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        GROUP BY ${escapedColumn}::VARCHAR
        ORDER BY frequency DESC
        LIMIT 5
      `;

      const formatResults = await this.db.query<{
        example: string;
        frequency: number;
      }>(formatSql);

      // Detect common patterns based on examples
      const commonFormats = formatResults.map((r) => {
        const example = r.example;
        let format = 'unknown';

        if (/^\d{4}-\d{2}-\d{2}$/.test(example)) {
          format = 'YYYY-MM-DD';
        } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(example)) {
          format = 'YYYY-MM-DD HH:MM:SS';
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(example)) {
          format = 'ISO 8601';
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(example)) {
          format = 'MM/DD/YYYY';
        }

        return { format, frequency: r.frequency };
      });

      return {
        hasTimeComponent: (result?.time_component_ratio ?? 0) > 0.1,
        hasTimezone: (result?.timezone_ratio ?? 0) > 0.1,
        commonFormats,
      };
    }

    return {};
  }

  /**
   * Batch analyze datetime columns
   */
  async batchAnalyzeDateTimeColumns(columns: string[]): Promise<Map<string, DateTimeMetadata>> {
    logger.log('Analyzing datetime columns', { columnCount: columns.length });

    const results = new Map<string, DateTimeMetadata>();

    // Process columns in parallel
    const promises = columns.map(async (column) => {
      try {
        const metadata = await this.analyzeDateTimeColumn(column);
        results.set(column, metadata);
      } catch (error) {
        logger.error(`Failed to analyze datetime column ${column}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results.set(column, {});
      }
    });

    await Promise.all(promises);

    logger.log('DateTime analysis completed', { columnsProcessed: columns.length });
    return results;
  }
}
