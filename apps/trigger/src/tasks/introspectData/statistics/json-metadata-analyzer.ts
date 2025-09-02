import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { JsonMetadata } from './types';

/**
 * Analyzes JSON columns for schema inference and structural patterns
 */
export class JsonMetadataAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Analyze a JSON column to extract schema and structural metadata
   */
  async analyzeJsonColumn(columnName: string): Promise<JsonMetadata> {
    try {
      const results = await Promise.allSettled([
        this.getSchemaInference(columnName),
        this.getKeyAnalysis(columnName),
        this.getValidationAnalysis(columnName),
      ]);

      const schema = results[0].status === 'fulfilled' ? results[0].value : undefined;
      const keyAnalysis = results[1].status === 'fulfilled' ? results[1].value : undefined;
      const validation = results[2].status === 'fulfilled' ? results[2].value : {};

      const result: JsonMetadata = { ...validation };

      if (schema !== undefined) {
        result.inferredSchema = schema;
      }

      if (keyAnalysis !== undefined) {
        result.keyAnalysis = keyAnalysis;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to analyze JSON column ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  private async getSchemaInference(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // First determine the primary JSON type (object vs array vs mixed)
    const typeSql = `
      WITH json_type_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as json_str,
          CASE 
            WHEN TRIM(${escapedColumn}::VARCHAR) LIKE '{%}' THEN 'object'
            WHEN TRIM(${escapedColumn}::VARCHAR) LIKE '[%]' THEN 'array'
            ELSE 'other'
          END as json_type,
          LENGTH(${escapedColumn}::VARCHAR) as size
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND TRIM(${escapedColumn}::VARCHAR) != ''
        LIMIT 1000
      )
      SELECT 
        json_type,
        COUNT(*) as count,
        AVG(size) as avg_size
      FROM json_type_analysis
      WHERE json_type IN ('object', 'array')
      GROUP BY json_type
      ORDER BY count DESC
    `;

    const typeResults = await this.db.query<{
      json_type: 'object' | 'array';
      count: number;
      avg_size: number;
    }>(typeSql);

    if (typeResults.length === 0) {
      return undefined;
    }

    const firstResult = typeResults[0];
    if (!firstResult) {
      return undefined;
    }
    const primaryType = firstResult.json_type;
    const avgSize = Math.round(
      typeResults.reduce((sum, r) => sum + r.avg_size * r.count, 0) /
        typeResults.reduce((sum, r) => sum + r.count, 0)
    );

    let commonKeys: Array<{ key: string; frequency: number; type: string }> | undefined;
    let arrayElementTypes: Record<string, number> | undefined;
    let maxDepth: number | undefined;

    if (primaryType === 'object') {
      // Analyze object keys - use a simplified approach since DuckDB JSON functions are limited
      const keySql = `
        WITH json_keys AS (
          SELECT 
            ${escapedColumn}::VARCHAR as json_str
          FROM ${this.db.getTableName()}
          WHERE ${escapedColumn} IS NOT NULL
            AND TRIM(${escapedColumn}::VARCHAR) LIKE '{%}'
          LIMIT 100
        )
        SELECT 
          json_str,
          LENGTH(json_str) - LENGTH(REPLACE(json_str, '":', '')) as key_count_estimate,
          (LENGTH(json_str) - LENGTH(REPLACE(json_str, '{', '')) + 
           LENGTH(json_str) - LENGTH(REPLACE(json_str, '[', ''))) as depth_estimate
        FROM json_keys
      `;

      const keyResults = await this.db.query<{
        json_str: string;
        key_count_estimate: number;
        depth_estimate: number;
      }>(keySql);

      // Extract keys using simple pattern matching (fallback approach)
      const keyFrequency: Record<string, number> = {};
      let totalDepth = 0;

      for (const result of keyResults) {
        try {
          const parsed = JSON.parse(result.json_str);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            for (const key of Object.keys(parsed)) {
              keyFrequency[key] = (keyFrequency[key] || 0) + 1;
            }
            totalDepth += this.calculateJsonDepth(parsed);
          }
        } catch {
          // Skip invalid JSON, continue with pattern matching
          const keyMatches = result.json_str.match(/"([^"]+)":/g);
          if (keyMatches) {
            for (const match of keyMatches) {
              const key = match.slice(1, -2); // Remove quotes and colon
              keyFrequency[key] = (keyFrequency[key] || 0) + 1;
            }
          }
        }
      }

      commonKeys = Object.entries(keyFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([key, frequency]) => ({
          key,
          frequency,
          type: 'unknown', // Would need deeper analysis to determine types
        }));

      maxDepth = keyResults.length > 0 ? Math.round(totalDepth / keyResults.length) : undefined;
    } else if (primaryType === 'array') {
      // Analyze array element types
      const arraySql = `
        WITH array_analysis AS (
          SELECT 
            ${escapedColumn}::VARCHAR as json_str
          FROM ${this.db.getTableName()}
          WHERE ${escapedColumn} IS NOT NULL
            AND TRIM(${escapedColumn}::VARCHAR) LIKE '[%]'
          LIMIT 100
        )
        SELECT 
          json_str,
          LENGTH(json_str) - LENGTH(REPLACE(json_str, ',', '')) + 1 as element_count_estimate
        FROM array_analysis
      `;

      const arrayResults = await this.db.query<{
        json_str: string;
        element_count_estimate: number;
      }>(arraySql);

      const elementTypes: Record<string, number> = {};

      for (const result of arrayResults) {
        try {
          const parsed = JSON.parse(result.json_str);
          if (Array.isArray(parsed)) {
            for (const element of parsed) {
              const type = Array.isArray(element) ? 'array' : typeof element;
              elementTypes[type] = (elementTypes[type] || 0) + 1;
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }

      arrayElementTypes = Object.keys(elementTypes).length > 0 ? elementTypes : undefined;
    }

    const result: NonNullable<JsonMetadata['inferredSchema']> = {
      type: (typeResults.length > 1 ? 'mixed' : primaryType) as 'object' | 'array' | 'mixed',
      avgSize,
    };

    if (commonKeys !== undefined && commonKeys.length > 0) {
      result.commonKeys = commonKeys;
    }

    if (arrayElementTypes !== undefined) {
      result.arrayElementTypes = arrayElementTypes;
    }

    if (maxDepth !== undefined) {
      result.maxDepth = maxDepth;
    }

    return result;
  }

  private calculateJsonDepth(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }

    let maxDepth = 0;
    for (const value of Object.values(obj)) {
      const depth = this.calculateJsonDepth(value) + 1;
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  private async getKeyAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // This is a simplified version focusing on object-type JSON
    const keyAnalysisSql = `
      WITH json_objects AS (
        SELECT 
          ${escapedColumn}::VARCHAR as json_str
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND TRIM(${escapedColumn}::VARCHAR) LIKE '{%}'
        LIMIT 500
      )
      SELECT 
        COUNT(*) as total_objects,
        AVG(LENGTH(json_str) - LENGTH(REPLACE(json_str, '":', ''))) as avg_key_count
      FROM json_objects
    `;

    const analysisResults = await this.db.query<{
      total_objects: number;
      avg_key_count: number;
    }>(keyAnalysisSql);

    const firstAnalysisResult = analysisResults[0];
    if (
      analysisResults.length === 0 ||
      !firstAnalysisResult ||
      firstAnalysisResult.total_objects === 0
    ) {
      return undefined;
    }

    // Extract keys using simple pattern analysis since DuckDB JSON functions are limited
    const keySample = await this.db.query<{ json_str: string }>(`
      SELECT ${escapedColumn}::VARCHAR as json_str
      FROM ${this.db.getTableName()}
      WHERE ${escapedColumn} IS NOT NULL
        AND TRIM(${escapedColumn}::VARCHAR) LIKE '{%}'
      LIMIT 100
    `);

    const allKeys = new Set<string>();
    const keyFrequency: Record<string, number> = {};
    const keyPatterns: Record<string, number> = {};

    for (const sample of keySample) {
      try {
        const parsed = JSON.parse(sample.json_str);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          for (const key of Object.keys(parsed)) {
            allKeys.add(key);
            keyFrequency[key] = (keyFrequency[key] || 0) + 1;

            // Analyze key naming patterns
            if (/^[a-z]+_[a-z]+/.test(key)) {
              keyPatterns.snake_case = (keyPatterns.snake_case || 0) + 1;
            } else if (/^[a-z]+[A-Z]/.test(key)) {
              keyPatterns.camelCase = (keyPatterns.camelCase || 0) + 1;
            } else if (/^[a-z]+$/.test(key)) {
              keyPatterns.lowercase = (keyPatterns.lowercase || 0) + 1;
            } else {
              keyPatterns.other = (keyPatterns.other || 0) + 1;
            }
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    const mostCommonKeys = Object.entries(keyFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([key, frequency]) => ({ key, frequency }));

    const keyNamingPatterns = Object.entries(keyPatterns).map(([pattern, frequency]) => ({
      pattern,
      frequency,
    }));

    const result: NonNullable<JsonMetadata['keyAnalysis']> = {
      totalUniqueKeys: allKeys.size,
      mostCommonKeys,
    };

    if (keyNamingPatterns.length > 0) {
      result.keyNamingPatterns = keyNamingPatterns;
    }

    return result;
  }

  private async getValidationAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const validationSql = `
      WITH json_validation AS (
        SELECT 
          ${escapedColumn}::VARCHAR as json_str,
          CASE 
            WHEN ${escapedColumn}::VARCHAR IS NULL OR TRIM(${escapedColumn}::VARCHAR) = ''
            THEN 'empty'
            WHEN (TRIM(${escapedColumn}::VARCHAR) LIKE '{%}' AND TRIM(${escapedColumn}::VARCHAR) LIKE '%}')
              OR (TRIM(${escapedColumn}::VARCHAR) LIKE '[%]' AND TRIM(${escapedColumn}::VARCHAR) LIKE '%]')
            THEN 'valid_structure'
            WHEN TRIM(${escapedColumn}::VARCHAR) LIKE '{%' OR TRIM(${escapedColumn}::VARCHAR) LIKE '[%'
            THEN 'incomplete'
            ELSE 'invalid_structure'
          END as structure_status
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        structure_status,
        COUNT(*) as count
      FROM json_validation
      GROUP BY structure_status
    `;

    const results = await this.db.query<{
      structure_status: string;
      count: number;
    }>(validationSql);

    if (results.length === 0) {
      return {};
    }

    const validJsonCount =
      results.find((r) => r.structure_status === 'valid_structure')?.count || 0;
    const invalidJsonCount = results
      .filter((r) => r.structure_status !== 'valid_structure')
      .reduce((sum, r) => sum + r.count, 0);

    const parseErrors = results
      .filter((r) => r.structure_status !== 'valid_structure')
      .map((r) => ({
        error: r.structure_status,
        frequency: r.count,
      }));

    const result: Pick<JsonMetadata, 'validJsonCount' | 'invalidJsonCount' | 'parseErrors'> = {};

    if (validJsonCount > 0) {
      result.validJsonCount = validJsonCount;
    }

    if (invalidJsonCount > 0) {
      result.invalidJsonCount = invalidJsonCount;
    }

    if (parseErrors.length > 0) {
      result.parseErrors = parseErrors;
    }

    return result;
  }

  /**
   * Batch analyze JSON columns
   */
  async batchAnalyzeJsonColumns(columns: string[]): Promise<Map<string, JsonMetadata>> {
    logger.log('Analyzing JSON columns', { columnCount: columns.length });

    const results = new Map<string, JsonMetadata>();

    // Process columns in parallel
    const promises = columns.map(async (column) => {
      try {
        const metadata = await this.analyzeJsonColumn(column);
        results.set(column, metadata);
      } catch (error) {
        logger.error(`Failed to analyze JSON column ${column}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results.set(column, {});
      }
    });

    await Promise.all(promises);

    logger.log('JSON analysis completed', { columnsProcessed: columns.length });
    return results;
  }
}
