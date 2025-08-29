import { logger } from '@trigger.dev/sdk';
import { z } from 'zod';
import { type DuckDBManager, SQLQuery } from './duckdb-manager';
import type { BasicStats } from './types';

/**
 * Improved basic statistics analyzer with type safety
 */
export class BasicStatsAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Compute null rate for a column with parameterized query
   */
  async computeNullRate(column: string): Promise<number> {
    const escapedColumn = this.escapeIdentifier(column);
    const sql = `
      SELECT 
        SUM(CASE WHEN "${escapedColumn}" IS NULL THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as null_rate
      FROM ${this.db.getTableName()}
    `;

    const result = await this.db.query<{ null_rate: number }>(sql);
    return result[0]?.null_rate ?? 0;
  }

  /**
   * Compute distinct count for a column
   */
  async computeDistinctCount(column: string): Promise<number> {
    const escapedColumn = this.escapeIdentifier(column);
    const sql = `
      SELECT COUNT(DISTINCT "${escapedColumn}") as distinct_count 
      FROM ${this.db.getTableName()}
    `;

    const result = await this.db.query<{ distinct_count: number }>(sql);
    return result[0]?.distinct_count ?? 0;
  }

  /**
   * Compute uniqueness ratio for a column
   */
  async computeUniquenessRatio(column: string): Promise<number> {
    const escapedColumn = this.escapeIdentifier(column);
    const sql = `
      SELECT 
        COUNT(DISTINCT "${escapedColumn}") * 1.0 / COUNT(*) as uniqueness_ratio
      FROM ${this.db.getTableName()}
    `;

    const result = await this.db.query<{ uniqueness_ratio: number }>(sql);
    return result[0]?.uniqueness_ratio ?? 0;
  }

  /**
   * Compute empty string rate for text columns
   */
  async computeEmptyStringRate(column: string, isTextColumn: boolean): Promise<number> {
    if (!isTextColumn) {
      return 0;
    }

    const escapedColumn = this.escapeIdentifier(column);
    const sql = `
      SELECT 
        SUM(CASE WHEN "${escapedColumn}" = '' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as empty_string_rate
      FROM ${this.db.getTableName()}
    `;

    try {
      const result = await this.db.query<{ empty_string_rate: number }>(sql);
      return result[0]?.empty_string_rate ?? 0;
    } catch (error) {
      logger.warn(`Failed to compute empty string rate for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Batch compute basic statistics with improved performance
   */
  async batchComputeBasicStats(
    columnMetadata: Array<{ name: string; type: string }>
  ): Promise<Map<string, BasicStats>> {
    logger.log('Computing basic statistics for columns', {
      columnCount: columnMetadata.length,
    });

    const stats = new Map<string, BasicStats>();

    if (columnMetadata.length === 0) {
      return stats;
    }

    try {
      // Build optimized batch query
      const selectClauses = this.buildBatchSelectClauses(columnMetadata);

      if (selectClauses.length === 0) {
        return stats;
      }

      const sql = `
        SELECT 
          ${selectClauses.join(',\n          ')}
        FROM ${this.db.getTableName()}
      `;

      const result = await this.db.query<Record<string, number>>(sql);

      if (result.length > 0 && result[0]) {
        const row = result[0];

        for (const col of columnMetadata) {
          const nullRateKey = `${col.name}_null_rate`;
          const distinctCountKey = `${col.name}_distinct_count`;
          const uniquenessRatioKey = `${col.name}_uniqueness_ratio`;
          const emptyRateKey = `${col.name}_empty_rate`;

          stats.set(col.name, {
            nullRate: this.getNumericValue(row[nullRateKey], 0),
            distinctCount: this.getNumericValue(row[distinctCountKey], 0),
            uniquenessRatio: this.getNumericValue(row[uniquenessRatioKey], 0),
            emptyStringRate: this.getNumericValue(row[emptyRateKey], 0),
          });
        }
      }

      logger.log('Basic statistics computed successfully', {
        columnsProcessed: columnMetadata.length,
      });
    } catch (error) {
      logger.error('Error computing batch basic statistics', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to individual queries
      await this.fallbackToIndividualQueries(columnMetadata, stats);
    }

    return stats;
  }

  /**
   * Build select clauses for batch query
   */
  private buildBatchSelectClauses(columnMetadata: Array<{ name: string; type: string }>): string[] {
    const clauses: string[] = [];

    for (const col of columnMetadata) {
      const escapedCol = this.escapeIdentifier(col.name);
      const safeAlias = this.getSafeAlias(col.name);

      // Basic statistics that apply to all columns
      clauses.push(
        `SUM(CASE WHEN "${escapedCol}" IS NULL THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as "${safeAlias}_null_rate"`,
        `COUNT(DISTINCT "${escapedCol}") as "${safeAlias}_distinct_count"`,
        `COUNT(DISTINCT "${escapedCol}") * 1.0 / COUNT(*) as "${safeAlias}_uniqueness_ratio"`
      );

      // Empty string rate only for text columns
      if (this.isTextType(col.type)) {
        clauses.push(
          `SUM(CASE WHEN "${escapedCol}" = '' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as "${safeAlias}_empty_rate"`
        );
      } else {
        clauses.push(`0 as "${safeAlias}_empty_rate"`);
      }
    }

    return clauses;
  }

  /**
   * Fallback to individual queries if batch fails
   */
  private async fallbackToIndividualQueries(
    columnMetadata: Array<{ name: string; type: string }>,
    stats: Map<string, BasicStats>
  ): Promise<void> {
    logger.warn('Falling back to individual queries for basic statistics');

    for (const col of columnMetadata) {
      try {
        const isTextColumn = this.isTextType(col.type);

        const [nullRate, distinctCount, uniquenessRatio, emptyStringRate] = await Promise.all([
          this.computeNullRate(col.name),
          this.computeDistinctCount(col.name),
          this.computeUniquenessRatio(col.name),
          this.computeEmptyStringRate(col.name, isTextColumn),
        ]);

        stats.set(col.name, {
          nullRate,
          distinctCount,
          uniquenessRatio,
          emptyStringRate,
        });
      } catch (error) {
        logger.error(`Failed to compute basic stats for column ${col.name}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Set default values on error
        stats.set(col.name, {
          nullRate: 0,
          distinctCount: 0,
          uniquenessRatio: 0,
          emptyStringRate: 0,
        });
      }
    }
  }

  /**
   * Check if a type is text-based
   */
  private isTextType(type: string): boolean {
    const textTypes = ['VARCHAR', 'TEXT', 'STRING', 'CHAR'];
    const upperType = type.toUpperCase();
    return textTypes.some((textType) => upperType.includes(textType));
  }

  /**
   * Escape identifier to prevent SQL injection
   */
  private escapeIdentifier(identifier: string): string {
    return identifier.replace(/"/g, '""');
  }

  /**
   * Get safe alias for column name (handle special characters)
   */
  private getSafeAlias(columnName: string): string {
    // Replace problematic characters with underscores
    return columnName.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Safely get numeric value with fallback
   */
  private getNumericValue(value: unknown, fallback: number): number {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }
}
