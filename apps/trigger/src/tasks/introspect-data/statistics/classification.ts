import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { ColumnClassification } from './types';

/**
 * Classify columns based on their characteristics
 */
export class ClassificationAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Detect if a column is likely an enumeration
   */
  async detectEnum(column: string): Promise<{ isEnum: boolean; enumValues?: string[] }> {
    const sql = `
      WITH enum_check AS (
        SELECT 
          COUNT(DISTINCT "${column}") as distinct_count,
          COUNT(DISTINCT "${column}") * 1.0 / COUNT(*) as uniqueness,
          COUNT(*) as total_count
        FROM ${this.db.getTableName()}
      ),
      top_values AS (
        SELECT 
          "${column}" as value,
          COUNT(*) as cnt
        FROM ${this.db.getTableName()}
        GROUP BY "${column}"
        ORDER BY cnt DESC
        LIMIT 10
      ),
      coverage AS (
        SELECT 
          SUM(cnt) * 1.0 / (SELECT total_count FROM enum_check) as top10_coverage
        FROM top_values
      )
      SELECT 
        ec.distinct_count,
        ec.uniqueness,
        c.top10_coverage,
        CASE 
          WHEN ec.distinct_count <= 2 
           AND ec.total_count >= 3
          THEN true
          WHEN ec.distinct_count <= 20 
           AND ec.uniqueness <= 0.05 
          THEN true
          WHEN ec.distinct_count < 100 
           AND ec.uniqueness <= 0.1 
           AND c.top10_coverage >= 0.9 
          THEN true 
          ELSE false 
        END as is_likely_enum
      FROM enum_check ec, coverage c
    `;

    try {
      const result = await this.db.query<{
        distinct_count: number;
        uniqueness: number;
        top10_coverage: number;
        is_likely_enum: boolean;
      }>(sql);

      const isEnum = result[0]?.is_likely_enum ?? false;

      // If it's an enum, get the actual values
      let enumValues: string[] | undefined;
      const distinctCount = result[0]?.distinct_count;
      if (isEnum && distinctCount !== undefined && distinctCount < 100) {
        const valuesSQL = `
          SELECT "${column}" as value, COUNT(*) as frequency
          FROM ${this.db.getTableName()}
          WHERE "${column}" IS NOT NULL
          GROUP BY "${column}"
          ORDER BY frequency DESC, "${column}"
        `;

        const values = await this.db.query<{ value: unknown; frequency: number }>(valuesSQL);
        enumValues = values.map((v) => String(v.value));
      }

      if (isEnum && enumValues !== undefined) {
        return { isEnum: true, enumValues };
      }
      return { isEnum };
    } catch (error) {
      logger.warn(`Failed to detect enum for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return { isEnum: false };
    }
  }

  /**
   * Detect if a column is likely an identifier
   */
  async detectIdentifier(column: string): Promise<{
    isIdentifier: boolean;
    identifierType?: 'primary_key' | 'foreign_key' | 'natural_key' | 'sequential' | 'uuid_like';
  }> {
    const sql = `
      WITH identifier_check AS (
        SELECT 
          COUNT(DISTINCT "${column}") * 1.0 / COUNT(*) as uniqueness,
          SUM(CASE WHEN "${column}" IS NULL THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as null_rate,
          COUNT(*) as total_count,
          COUNT(DISTINCT "${column}") as distinct_count
        FROM ${this.db.getTableName()}
      ),
      sequential_check AS (
        -- Check if numeric values are sequential
        SELECT 
          CASE 
            WHEN COUNT(*) >= 10 
             AND TRY_CAST(MAX("${column}") AS BIGINT) IS NOT NULL
             AND TRY_CAST(MIN("${column}") AS BIGINT) IS NOT NULL
             AND TRY_CAST(MAX("${column}") AS BIGINT) - TRY_CAST(MIN("${column}") AS BIGINT) = COUNT(DISTINCT "${column}") - 1
            THEN true 
            ELSE false 
          END as is_sequential
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
      ),
      uuid_check AS (
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 
             AND AVG(CASE 
               WHEN LENGTH(CAST("${column}" AS VARCHAR)) = 36
                AND CAST("${column}" AS VARCHAR) LIKE '________-____-____-____-____________' 
               THEN 1.0
               ELSE 0.0
             END) > 0.9
            THEN true
            ELSE false
          END as is_uuid_like
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
        LIMIT 100
      ),
      date_check AS (
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 
             AND COUNT(CASE 
               WHEN CAST("${column}" AS VARCHAR) SIMILAR TO '[0-9]{4}-[0-9]{2}-[0-9]{2}.*' 
                 OR CAST("${column}" AS VARCHAR) SIMILAR TO '[0-9]{2}/[0-9]{2}/[0-9]{4}.*'
               THEN 1 
             END) > COUNT(*) * 0.8
            THEN true
            ELSE false
          END as is_date_like
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
        LIMIT 100
      )
      SELECT 
        ic.*,
        sc.is_sequential,
        uc.is_uuid_like,
        dc.is_date_like,
        CASE 
          WHEN dc.is_date_like THEN false
          WHEN ic.distinct_count < 10 THEN false
          WHEN ic.uniqueness > 0.95 AND ic.null_rate < 0.01 AND ic.distinct_count >= 10 THEN true
          WHEN ic.uniqueness = 1.0 AND ic.distinct_count >= 10 THEN true
          WHEN sc.is_sequential THEN true
          WHEN uc.is_uuid_like AND ic.uniqueness > 0.9 THEN true
          ELSE false
        END as is_likely_identifier
      FROM identifier_check ic, sequential_check sc, uuid_check uc, date_check dc
    `;

    try {
      const result = await this.db.query<{
        uniqueness: number;
        null_rate: number;
        distinct_count: number;
        is_sequential: boolean;
        is_uuid_like: boolean;
        is_date_like: boolean;
        is_likely_identifier: boolean;
      }>(sql);

      const isIdentifier = result[0]?.is_likely_identifier ?? false;
      let identifierType:
        | 'primary_key'
        | 'foreign_key'
        | 'natural_key'
        | 'sequential'
        | 'uuid_like'
        | undefined;

      if (isIdentifier) {
        const uniqueness = result[0]?.uniqueness ?? 0;
        const nullRate = result[0]?.null_rate ?? 0;
        const isSequential = result[0]?.is_sequential ?? false;
        const isUuidLike = result[0]?.is_uuid_like ?? false;
        const columnLower = column.toLowerCase();

        if (isUuidLike) {
          identifierType = 'uuid_like';
        } else if (isSequential) {
          identifierType = 'sequential';
        } else if (uniqueness === 1.0 && nullRate === 0) {
          identifierType = 'primary_key';
        } else if (
          uniqueness > 0.95 &&
          (columnLower.includes('_id') ||
            columnLower.includes('id_') ||
            columnLower === 'id' ||
            columnLower.endsWith('_key'))
        ) {
          // If it looks like an ID column name and has high uniqueness
          identifierType = 'primary_key';
        } else if (
          uniqueness > 0.95 &&
          (columnLower.includes('_id') || columnLower.includes('_key'))
        ) {
          identifierType = 'foreign_key';
        } else if (uniqueness > 0.95) {
          identifierType = 'natural_key';
        }
      }

      if (isIdentifier && identifierType !== undefined) {
        return { isIdentifier: true, identifierType };
      }
      return { isIdentifier };
    } catch (error) {
      logger.warn(`Failed to detect identifier for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return { isIdentifier: false };
    }
  }

  /**
   * Classify a column based on its characteristics
   */
  async classifyColumn(column: string): Promise<ColumnClassification> {
    try {
      const [enumResult, identifierResult] = await Promise.all([
        this.detectEnum(column),
        this.detectIdentifier(column),
      ]);

      const result: ColumnClassification = {
        isLikelyEnum: enumResult.isEnum,
        isLikelyIdentifier: identifierResult.isIdentifier,
      };

      if (identifierResult.identifierType !== undefined) {
        result.identifierType = identifierResult.identifierType;
      }

      if (enumResult.enumValues !== undefined) {
        result.enumValues = enumResult.enumValues;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to classify column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        isLikelyEnum: false,
        isLikelyIdentifier: false,
      };
    }
  }

  /**
   * Batch classify multiple columns
   */
  async batchClassifyColumns(columns: string[]): Promise<Map<string, ColumnClassification>> {
    logger.log('Classifying columns', { columnCount: columns.length });

    const classifications = new Map<string, ColumnClassification>();

    // Classify columns in parallel
    const promises = columns.map(async (col) => {
      const classification = await this.classifyColumn(col);
      classifications.set(col, classification);
    });

    await Promise.all(promises);

    logger.log('Column classification completed', { columnsProcessed: columns.length });

    return classifications;
  }
}
