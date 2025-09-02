import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';

/**
 * Column semantic type detection based on content analysis
 */
export type ColumnSemanticType =
  | 'datetime'
  | 'numeric'
  | 'identifier'
  | 'url'
  | 'email'
  | 'json'
  | 'text' // fallback for regular text columns
  | 'unknown'; // fallback when detection fails

export interface ColumnTypeInfo {
  semanticType: ColumnSemanticType;
  confidence: number; // 0-1 confidence score
  sqlDataType: string;
  reasoning: string[];
}

/**
 * Detects the semantic type of columns based on their content patterns
 */
export class ColumnTypeDetector {
  constructor(private db: DuckDBManager) {}

  /**
   * Detect semantic type for a single column
   */
  async detectColumnType(
    columnName: string,
    sqlDataType: string,
    sampleValues: unknown[]
  ): Promise<ColumnTypeInfo> {
    const reasoning: string[] = [];
    let semanticType: ColumnSemanticType = 'unknown';
    let confidence = 0;

    try {
      // Start with SQL data type hints
      if (this.isDateTimeType(sqlDataType)) {
        const dateAnalysis = await this.analyzeDateTimeColumn(columnName, sampleValues);
        if (dateAnalysis.confidence > confidence) {
          semanticType = 'datetime';
          confidence = dateAnalysis.confidence;
          reasoning.push(...dateAnalysis.reasoning);
        }
      }

      if (this.isNumericType(sqlDataType)) {
        const numericAnalysis = await this.analyzeNumericColumn(columnName, sampleValues);
        if (numericAnalysis.confidence > confidence) {
          semanticType = 'numeric';
          confidence = numericAnalysis.confidence;
          reasoning.push(...numericAnalysis.reasoning);
        }
      }

      // Content-based detection (even for non-obvious types)
      const contentAnalyses = await Promise.all([
        this.analyzeForIdentifier(columnName, sampleValues),
        this.analyzeForUrl(columnName, sampleValues),
        this.analyzeForEmail(columnName, sampleValues),
        this.analyzeForJson(columnName, sampleValues),
      ]);

      // Find the highest confidence analysis
      for (const analysis of contentAnalyses) {
        if (analysis.confidence > confidence) {
          semanticType = analysis.semanticType;
          confidence = analysis.confidence;
          reasoning.push(...analysis.reasoning);
        }
      }

      // Fallback to text if confidence is low
      if (confidence < 0.3 && semanticType === 'unknown') {
        semanticType = 'text';
        confidence = 0.1;
        reasoning.push('No strong pattern detected, defaulting to text');
      }

      return {
        semanticType,
        confidence,
        sqlDataType,
        reasoning,
      };
    } catch (error) {
      logger.error(`Failed to detect column type for ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        semanticType: 'unknown',
        confidence: 0,
        sqlDataType,
        reasoning: ['Detection failed due to error'],
      };
    }
  }

  /**
   * Batch detect types for multiple columns
   */
  async batchDetectColumnTypes(
    columns: Array<{ name: string; type: string; sampleValues: unknown[] }>
  ): Promise<Map<string, ColumnTypeInfo>> {
    const results = new Map<string, ColumnTypeInfo>();

    // Process all columns in parallel for efficiency
    const promises = columns.map(async ({ name, type, sampleValues }) => {
      const typeInfo = await this.detectColumnType(name, type, sampleValues);
      results.set(name, typeInfo);
    });

    await Promise.all(promises);

    logger.log('Column type detection completed', {
      columnsProcessed: columns.length,
      detectedTypes: Array.from(results.values()).reduce(
        (acc, info) => {
          acc[info.semanticType] = (acc[info.semanticType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    });

    return results;
  }

  private isDateTimeType(sqlType: string): boolean {
    const dateTypes = [
      'DATE',
      'TIME',
      'TIMESTAMP',
      'DATETIME',
      'TIMESTAMPTZ',
      'TIMESTAMP WITH TIME ZONE',
      'TIMESTAMP WITHOUT TIME ZONE',
    ];
    return dateTypes.some((type) => sqlType.toUpperCase().includes(type));
  }

  private isNumericType(sqlType: string): boolean {
    const numericTypes = [
      'INTEGER',
      'INT',
      'BIGINT',
      'SMALLINT',
      'TINYINT',
      'DECIMAL',
      'NUMERIC',
      'FLOAT',
      'DOUBLE',
      'REAL',
      'MONEY',
      'NUMBER',
    ];
    return numericTypes.some((type) => sqlType.toUpperCase().includes(type));
  }

  private async analyzeDateTimeColumn(
    _columnName: string,
    sampleValues: unknown[]
  ): Promise<{ semanticType: 'datetime'; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0.9; // High confidence since SQL type is already date/time

    // Check if values look like dates
    const validDateCount = sampleValues.filter((value) => {
      if (!value) return false;
      const dateValue = new Date(String(value));
      return !Number.isNaN(dateValue.getTime());
    }).length;

    const validDateRatio = sampleValues.length > 0 ? validDateCount / sampleValues.length : 0;

    if (validDateRatio > 0.8) {
      reasoning.push(`${Math.round(validDateRatio * 100)}% of values are valid dates`);
      confidence = Math.max(confidence, 0.9);
    } else {
      reasoning.push(`Only ${Math.round(validDateRatio * 100)}% of values are valid dates`);
      confidence *= validDateRatio;
    }

    reasoning.push('SQL data type indicates date/time');

    return { semanticType: 'datetime', confidence, reasoning };
  }

  private async analyzeNumericColumn(
    _columnName: string,
    sampleValues: unknown[]
  ): Promise<{ semanticType: 'numeric'; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0.9; // High confidence since SQL type is numeric

    // Additional validation for numeric values
    const validNumbers = sampleValues.filter((value) => {
      if (value === null || value === undefined) return true; // nulls are OK
      const num = Number(value);
      return !Number.isNaN(num) && Number.isFinite(num);
    }).length;

    const validNumberRatio = sampleValues.length > 0 ? validNumbers / sampleValues.length : 0;

    if (validNumberRatio > 0.95) {
      reasoning.push('All values are valid numbers');
    } else {
      reasoning.push(`${Math.round(validNumberRatio * 100)}% of values are valid numbers`);
      confidence *= validNumberRatio;
    }

    reasoning.push('SQL data type indicates numeric');

    return { semanticType: 'numeric', confidence, reasoning };
  }

  private async analyzeForIdentifier(
    columnName: string,
    sampleValues: unknown[]
  ): Promise<{ semanticType: 'identifier'; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0;

    // Column name patterns
    const idPatterns = [
      /^id$/i,
      /_id$/i,
      /^.*_id$/i,
      /uuid/i,
      /guid/i,
      /_key$/i,
      /^key_/i,
      /^pk_/i,
      /^fk_/i,
    ];

    if (idPatterns.some((pattern) => pattern.test(columnName))) {
      confidence += 0.3;
      reasoning.push('Column name suggests identifier');
    }

    if (sampleValues.length === 0) {
      return { semanticType: 'identifier', confidence, reasoning };
    }

    // UUID pattern detection
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const uuidCount = sampleValues.filter(
      (value) => value && uuidPattern.test(String(value))
    ).length;

    if (uuidCount > sampleValues.length * 0.8) {
      confidence = Math.max(confidence, 0.9);
      reasoning.push(
        `${Math.round((uuidCount / sampleValues.length) * 100)}% values match UUID pattern`
      );
    }

    // Sequential number detection
    const numericValues = sampleValues
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    if (numericValues.length > 5) {
      const isSequential = numericValues.every((val, idx) => {
        const prevValue = numericValues[idx - 1];
        return idx === 0 || (prevValue !== undefined && val === prevValue + 1);
      });

      if (isSequential) {
        confidence = Math.max(confidence, 0.8);
        reasoning.push('Values appear to be sequential');
      }
    }

    // High uniqueness for identifiers
    const uniqueValues = new Set(sampleValues.filter((v) => v !== null && v !== undefined));
    const uniqueness = uniqueValues.size / Math.max(sampleValues.length, 1);

    if (uniqueness > 0.95 && sampleValues.length > 10) {
      confidence += 0.2;
      reasoning.push(`High uniqueness ratio: ${Math.round(uniqueness * 100)}%`);
    }

    return { semanticType: 'identifier', confidence, reasoning };
  }

  private async analyzeForUrl(
    columnName: string,
    sampleValues: unknown[]
  ): Promise<{ semanticType: 'url'; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0;

    // Column name hints
    if (/url|link|href|uri|website|domain/i.test(columnName)) {
      confidence += 0.2;
      reasoning.push('Column name suggests URL');
    }

    if (sampleValues.length === 0) {
      return { semanticType: 'url', confidence, reasoning };
    }

    // URL pattern matching
    const urlPattern =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    const validUrls = sampleValues.filter(
      (value) => value && urlPattern.test(String(value))
    ).length;

    const urlRatio = validUrls / sampleValues.length;

    if (urlRatio > 0.8) {
      confidence = Math.max(confidence, 0.9);
      reasoning.push(`${Math.round(urlRatio * 100)}% of values match URL pattern`);
    } else if (urlRatio > 0.5) {
      confidence = Math.max(confidence, 0.6);
      reasoning.push(`${Math.round(urlRatio * 100)}% of values match URL pattern`);
    }

    return { semanticType: 'url', confidence, reasoning };
  }

  private async analyzeForEmail(
    columnName: string,
    sampleValues: unknown[]
  ): Promise<{ semanticType: 'email'; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0;

    // Column name hints
    if (/email|mail|e-mail/i.test(columnName)) {
      confidence += 0.3;
      reasoning.push('Column name suggests email');
    }

    if (sampleValues.length === 0) {
      return { semanticType: 'email', confidence, reasoning };
    }

    // Email pattern matching
    const emailPattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const validEmails = sampleValues.filter(
      (value) => value && emailPattern.test(String(value))
    ).length;

    const emailRatio = validEmails / sampleValues.length;

    if (emailRatio > 0.8) {
      confidence = Math.max(confidence, 0.95);
      reasoning.push(`${Math.round(emailRatio * 100)}% of values match email pattern`);
    } else if (emailRatio > 0.5) {
      confidence = Math.max(confidence, 0.7);
      reasoning.push(`${Math.round(emailRatio * 100)}% of values match email pattern`);
    }

    return { semanticType: 'email', confidence, reasoning };
  }

  private async analyzeForJson(
    columnName: string,
    sampleValues: unknown[]
  ): Promise<{ semanticType: 'json'; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0;

    // Column name hints
    if (/json|data|payload|config|metadata|attributes/i.test(columnName)) {
      confidence += 0.1;
      reasoning.push('Column name suggests JSON data');
    }

    if (sampleValues.length === 0) {
      return { semanticType: 'json', confidence, reasoning };
    }

    // JSON validation
    let validJsonCount = 0;
    for (const value of sampleValues) {
      if (!value) continue;
      try {
        const str = String(value);
        if (
          (str.startsWith('{') && str.endsWith('}')) ||
          (str.startsWith('[') && str.endsWith(']'))
        ) {
          JSON.parse(str);
          validJsonCount++;
        }
      } catch {
        // Not valid JSON
      }
    }

    const jsonRatio = validJsonCount / sampleValues.length;

    if (jsonRatio > 0.8) {
      confidence = Math.max(confidence, 0.9);
      reasoning.push(`${Math.round(jsonRatio * 100)}% of values are valid JSON`);
    } else if (jsonRatio > 0.5) {
      confidence = Math.max(confidence, 0.6);
      reasoning.push(`${Math.round(jsonRatio * 100)}% of values are valid JSON`);
    }

    return { semanticType: 'json', confidence, reasoning };
  }
}
