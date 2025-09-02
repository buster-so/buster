import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { IdentifierMetadata } from './types';

/**
 * Analyzes identifier columns for pattern detection and format validation
 */
export class IdentifierMetadataAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Analyze an identifier column to extract patterns and validation info
   */
  async analyzeIdentifierColumn(columnName: string): Promise<IdentifierMetadata> {
    try {
      const results = await Promise.allSettled([
        this.getPatternAnalysis(columnName),
        this.getFormatValidation(columnName),
        this.getUuidAnalysis(columnName),
        this.getSequentialAnalysis(columnName),
      ]);

      const patterns = results[0].status === 'fulfilled' ? results[0].value : undefined;
      const validation = results[1].status === 'fulfilled' ? results[1].value : undefined;
      const uuidAnalysis = results[2].status === 'fulfilled' ? results[2].value : undefined;
      const sequential = results[3].status === 'fulfilled' ? results[3].value : undefined;

      const result: IdentifierMetadata = {};

      if (patterns !== undefined) {
        result.patterns = patterns;
      }

      if (validation !== undefined) {
        result.formatValidation = validation;
      }

      if (uuidAnalysis !== undefined) {
        result.uuidAnalysis = uuidAnalysis;
      }

      if (sequential !== undefined) {
        result.sequentialAnalysis = sequential;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to analyze identifier column ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  private async getPatternAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // Extract common patterns from identifier values
    const patternSql = `
      WITH pattern_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as value,
          LENGTH(${escapedColumn}::VARCHAR) as length,
          CASE 
            -- UUID patterns
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' 
            THEN 'UUID-hyphenated'
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{32}'
            THEN 'UUID-compact'
            -- Numeric patterns
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[0-9]+'
            THEN 'numeric-' || LENGTH(${escapedColumn}::VARCHAR)::VARCHAR
            -- Alphanumeric patterns
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[A-Za-z][0-9]+'
            THEN 'alpha-numeric'
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[A-Za-z]{2,}[0-9]+'
            THEN 'prefix-numeric'
            -- Mixed patterns
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[A-Za-z0-9-_]+'
            THEN 'mixed-identifier'
            ELSE 'other'
          END as pattern
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        pattern,
        COUNT(*) as frequency,
        MIN(value) as example
      FROM pattern_analysis
      GROUP BY pattern
      ORDER BY frequency DESC
      LIMIT 10
    `;

    const results = await this.db.query<{
      pattern: string;
      frequency: number;
      example: string;
    }>(patternSql);

    return results.length > 0 ? results : undefined;
  }

  private async getFormatValidation(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const validationSql = `
      WITH validation AS (
        SELECT 
          ${escapedColumn}::VARCHAR as value,
          CASE 
            -- Check for common identifier format issues
            WHEN ${escapedColumn}::VARCHAR IS NULL OR TRIM(${escapedColumn}::VARCHAR) = '' 
            THEN 'empty'
            WHEN ${escapedColumn}::VARCHAR LIKE '% %' 
            THEN 'contains-spaces'
            WHEN LENGTH(${escapedColumn}::VARCHAR) < 3
            THEN 'too-short'
            WHEN LENGTH(${escapedColumn}::VARCHAR) > 255
            THEN 'too-long'
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '.*[^A-Za-z0-9-_.].*'
            THEN 'special-chars'
            ELSE 'valid'
          END as validation_status
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        validation_status,
        COUNT(*) as count
      FROM validation
      GROUP BY validation_status
    `;

    const results = await this.db.query<{
      validation_status: string;
      count: number;
    }>(validationSql);

    if (results.length === 0) return undefined;

    const validCount = results.find((r) => r.validation_status === 'valid')?.count || 0;
    const totalCount = results.reduce((sum, r) => sum + r.count, 0);
    const invalidCount = totalCount - validCount;

    const commonErrors = results
      .filter((r) => r.validation_status !== 'valid')
      .map((r) => ({
        error: r.validation_status,
        frequency: r.count,
      }));

    const result: NonNullable<IdentifierMetadata['formatValidation']> = {
      validCount,
      invalidCount,
    };

    if (commonErrors.length > 0) {
      result.commonErrors = commonErrors;
    }

    return result;
  }

  private async getUuidAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // First check if this looks like a UUID column
    const uuidCheckSql = `
      WITH uuid_check AS (
        SELECT 
          ${escapedColumn}::VARCHAR as value,
          CASE 
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' 
            THEN true
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{32}'
            THEN true
            ELSE false
          END as is_uuid
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 100
      )
      SELECT 
        AVG(CASE WHEN is_uuid THEN 1.0 ELSE 0.0 END) as uuid_ratio
      FROM uuid_check
    `;

    const checkResults = await this.db.query<{ uuid_ratio: number }>(uuidCheckSql);
    const uuidRatio = checkResults[0]?.uuid_ratio || 0;

    if (uuidRatio < 0.8) {
      return undefined; // Not a UUID column
    }

    // Detailed UUID analysis
    const uuidAnalysisSql = `
      WITH uuid_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as value,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%-%' THEN true
            ELSE false
          END as has_hyphens,
          CASE 
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '.*[A-F].*' THEN true
            ELSE false
          END as has_uppercase,
          CASE 
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}'
            THEN SUBSTRING(${escapedColumn}::VARCHAR FROM 15 FOR 1)
            ELSE NULL
          END as uuid_version
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND (${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' 
               OR ${escapedColumn}::VARCHAR SIMILAR TO '[0-9a-fA-F]{32}')
        LIMIT 100
      )
      SELECT 
        AVG(CASE WHEN has_hyphens THEN 1.0 ELSE 0.0 END) as hyphen_ratio,
        AVG(CASE WHEN has_uppercase THEN 1.0 ELSE 0.0 END) as uppercase_ratio,
        uuid_version,
        COUNT(*) as version_count
      FROM uuid_analysis
      GROUP BY uuid_version
      ORDER BY version_count DESC
    `;

    const analysisResults = await this.db.query<{
      hyphen_ratio: number;
      uppercase_ratio: number;
      uuid_version: string | null;
      version_count: number;
    }>(uuidAnalysisSql);

    if (analysisResults.length > 0) {
      const primaryResult = analysisResults[0];
      if (!primaryResult) {
        return undefined;
      }

      const version = primaryResult.uuid_version
        ? Number.parseInt(primaryResult.uuid_version, 10)
        : undefined;

      const variants: Record<string, number> = {};
      for (const result of analysisResults) {
        if (result.uuid_version) {
          variants[result.uuid_version] = result.version_count;
        }
      }

      const result: NonNullable<IdentifierMetadata['uuidAnalysis']> = {
        hasHyphens: primaryResult.hyphen_ratio > 0.5,
      };

      if (version !== undefined) {
        result.version = version;
      }

      if (primaryResult.uppercase_ratio > 0.5) {
        result.isUppercase = true;
      }

      if (Object.keys(variants).length > 0) {
        result.variants = variants;
      }

      return result;
    }

    return undefined;
  }

  private async getSequentialAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // Only analyze if the column contains numeric values
    const numericCheckSql = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN TRY_CAST(${escapedColumn} AS BIGINT) IS NOT NULL THEN 1 END) as numeric_count
      FROM ${this.db.getTableName()}
      WHERE ${escapedColumn} IS NOT NULL
      LIMIT 1000
    `;

    const checkResults = await this.db.query<{
      total_count: number;
      numeric_count: number;
    }>(numericCheckSql);

    const checkResult = checkResults[0];
    if (
      checkResults.length === 0 ||
      !checkResult ||
      checkResult.numeric_count < checkResult.total_count * 0.8
    ) {
      return undefined; // Not primarily numeric
    }

    // Analyze for sequential patterns
    const sequentialSql = `
      WITH numeric_values AS (
        SELECT 
          TRY_CAST(${escapedColumn} AS BIGINT) as num_value,
          ROW_NUMBER() OVER (ORDER BY TRY_CAST(${escapedColumn} AS BIGINT)) as row_num
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND TRY_CAST(${escapedColumn} AS BIGINT) IS NOT NULL
        ORDER BY TRY_CAST(${escapedColumn} AS BIGINT)
        LIMIT 1000
      ),
      sequence_analysis AS (
        SELECT 
          num_value,
          LAG(num_value) OVER (ORDER BY num_value) as prev_value,
          num_value - LAG(num_value) OVER (ORDER BY num_value) as increment
        FROM numeric_values
      )
      SELECT 
        MIN(num_value) as min_value,
        MAX(num_value) as max_value,
        COUNT(*) as total_count,
        COUNT(CASE WHEN increment = 1 THEN 1 END) as consecutive_count,
        AVG(increment) as avg_increment,
        MODE() WITHIN GROUP (ORDER BY increment) as common_increment
      FROM sequence_analysis
      WHERE prev_value IS NOT NULL
    `;

    const results = await this.db.query<{
      min_value: number;
      max_value: number;
      total_count: number;
      consecutive_count: number;
      avg_increment: number;
      common_increment: number;
    }>(sequentialSql);

    if (results.length === 0) return undefined;

    const result = results[0];
    if (!result) return undefined;

    const isSequential = result.consecutive_count > result.total_count * 0.8;

    // Find gaps if it's mostly sequential
    let gaps: Array<{ start: number; end: number }> | undefined;
    if (isSequential) {
      const gapSql = `
        WITH min_max AS (
          SELECT 
            MIN(TRY_CAST(${escapedColumn} AS BIGINT)) as min_val,
            MAX(TRY_CAST(${escapedColumn} AS BIGINT)) as max_val
          FROM ${this.db.getTableName()} 
          WHERE ${escapedColumn} IS NOT NULL
        ),
        expected_sequence AS (
          SELECT UNNEST(generate_series(min_val, max_val)) as expected_value
          FROM min_max
        ),
        actual_values AS (
          SELECT DISTINCT TRY_CAST(${escapedColumn} AS BIGINT) as actual_value
          FROM ${this.db.getTableName()}
          WHERE ${escapedColumn} IS NOT NULL AND TRY_CAST(${escapedColumn} AS BIGINT) IS NOT NULL
        )
        SELECT 
          expected_value as missing_value
        FROM expected_sequence
        LEFT JOIN actual_values ON expected_value = actual_value
        WHERE actual_value IS NULL
        ORDER BY expected_value
        LIMIT 50
      `;

      try {
        const gapResults = await this.db.query<{ missing_value: number }>(gapSql);
        if (gapResults.length > 0 && gapResults.length < 20) {
          // Group consecutive missing values into ranges
          gaps = this.groupConsecutiveGaps(gapResults.map((r) => r.missing_value));
        }
      } catch (error) {
        // Gap analysis failed, continue without gaps
        logger.warn(`Gap analysis failed for ${columnName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const returnResult: NonNullable<IdentifierMetadata['sequentialAnalysis']> = {
      isSequential,
    };

    if (gaps !== undefined) {
      returnResult.gaps = gaps;
    }

    if (isSequential) {
      returnResult.increment = result.common_increment || 1;
    }

    return returnResult;
  }

  private groupConsecutiveGaps(missingValues: number[]): Array<{ start: number; end: number }> {
    if (missingValues.length === 0) return [];

    const gaps: Array<{ start: number; end: number }> = [];
    let currentStart = missingValues[0];
    let currentEnd = missingValues[0];

    if (currentStart === undefined || currentEnd === undefined) {
      return [];
    }

    for (let i = 1; i < missingValues.length; i++) {
      const currentValue = missingValues[i];
      if (currentValue === undefined) continue;

      if (currentValue === currentEnd + 1) {
        currentEnd = currentValue;
      } else {
        gaps.push({ start: currentStart, end: currentEnd });
        currentStart = currentValue;
        currentEnd = currentValue;
      }
    }

    gaps.push({ start: currentStart, end: currentEnd });
    return gaps;
  }

  /**
   * Batch analyze identifier columns
   */
  async batchAnalyzeIdentifierColumns(columns: string[]): Promise<Map<string, IdentifierMetadata>> {
    logger.log('Analyzing identifier columns', { columnCount: columns.length });

    const results = new Map<string, IdentifierMetadata>();

    // Process columns in parallel
    const promises = columns.map(async (column) => {
      try {
        const metadata = await this.analyzeIdentifierColumn(column);
        results.set(column, metadata);
      } catch (error) {
        logger.error(`Failed to analyze identifier column ${column}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results.set(column, {});
      }
    });

    await Promise.all(promises);

    logger.log('Identifier analysis completed', { columnsProcessed: columns.length });
    return results;
  }
}
