import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';

/**
 * Extract representative sample values from columns
 */
export class SampleValuesExtractor {
  constructor(private db: DuckDBManager) {}

  /**
   * Check if column likely contains long text
   */
  private async isLongTextColumn(column: string, dataType: string): Promise<boolean> {
    const textTypes = ['VARCHAR', 'TEXT', 'STRING', 'CHAR'];
    const isTextType = textTypes.some((type) => dataType.toUpperCase().includes(type));

    if (!isTextType) {
      return false;
    }

    // Check average length of values
    const sql = `
      SELECT AVG(LENGTH(CAST("${column}" AS VARCHAR))) as avg_length
      FROM ${this.db.getTableName()}
      WHERE "${column}" IS NOT NULL
      LIMIT 100
    `;

    try {
      const result = await this.db.query<{ avg_length: number }>(sql);
      return (result[0]?.avg_length ?? 0) > 100;
    } catch (error) {
      logger.warn('Failed to determine if column contains long text', {
        column,
        dataType,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Check if column contains JSON data
   */
  private async isJsonColumn(column: string, dataType: string): Promise<boolean> {
    if (dataType.toUpperCase().includes('JSON')) {
      return true;
    }

    // Check if values look like JSON
    const sql = `
      SELECT COUNT(*) as json_count
      FROM (
        SELECT "${column}"
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
          AND (
            (CAST("${column}" AS VARCHAR) LIKE '{%}')
            OR (CAST("${column}" AS VARCHAR) LIKE '[%]')
          )
        LIMIT 10
      ) t
    `;

    try {
      const result = await this.db.query<{ json_count: number }>(sql);
      return (result[0]?.json_count ?? 0) > 5;
    } catch (error) {
      logger.warn('Failed to determine if column contains JSON data', {
        column,
        dataType,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get sample values for a standard column (50 distinct values)
   */
  async getStandardSampleValues(column: string, limit = 50): Promise<unknown[]> {
    const sql = `
      SELECT DISTINCT "${column}" as sample_value
      FROM ${this.db.getTableName()}
      WHERE "${column}" IS NOT NULL
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    try {
      const result = await this.db.query<{ sample_value: unknown }>(sql);
      return result.map((r) => r.sample_value);
    } catch (error) {
      logger.warn(`Failed to get standard sample values for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get sample values for long text columns (5 samples, truncated)
   */
  async getLongTextSampleValues(column: string, limit = 5, maxLength = 150): Promise<string[]> {
    const sql = `
      WITH sampled AS (
        SELECT "${column}"
        FROM ${this.db.getTableName()}
        WHERE "${column}" IS NOT NULL
        ORDER BY RANDOM()
        LIMIT ${limit}
      )
      SELECT 
        CASE 
          WHEN LENGTH(CAST("${column}" AS VARCHAR)) > ${maxLength}
          THEN SUBSTR(CAST("${column}" AS VARCHAR), 1, ${maxLength - 3}) || '...'
          ELSE CAST("${column}" AS VARCHAR)
        END as sample_value
      FROM sampled
    `;

    try {
      const result = await this.db.query<{ sample_value: string }>(sql);
      return result.map((r) => r.sample_value);
    } catch (error) {
      logger.warn(`Failed to get long text sample values for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get sample values for JSON columns (3 samples, simplified)
   */
  async getJsonSampleValues(column: string, limit = 3): Promise<unknown[]> {
    const sql = `
      SELECT "${column}" as sample_value
      FROM ${this.db.getTableName()}
      WHERE "${column}" IS NOT NULL
      ORDER BY "${column}"
      LIMIT ${limit}
    `;

    try {
      const result = await this.db.query<{ sample_value: unknown }>(sql);
      return result.map((r) => {
        // Try to parse and re-stringify for better formatting
        try {
          if (typeof r.sample_value === 'string') {
            return JSON.parse(r.sample_value);
          }
        } catch {
          // If parsing fails, return as-is
        }
        return r.sample_value;
      });
    } catch (error) {
      logger.warn(`Failed to get JSON sample values for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get appropriate sample values based on column characteristics
   */
  async getSampleValues(column: string, dataType: string): Promise<unknown[]> {
    try {
      // Check column type and get appropriate samples
      const [isLongText, isJson] = await Promise.all([
        this.isLongTextColumn(column, dataType),
        this.isJsonColumn(column, dataType),
      ]);

      if (isJson) {
        return await this.getJsonSampleValues(column);
      }
      if (isLongText) {
        return await this.getLongTextSampleValues(column);
      }
      return await this.getStandardSampleValues(column);
    } catch (error) {
      logger.error(`Failed to get sample values for column ${column}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Batch get sample values for multiple columns
   */
  async batchGetSampleValues(
    columns: Array<{ name: string; type: string }>
  ): Promise<Map<string, unknown[]>> {
    logger.log('Extracting sample values for columns', { columnCount: columns.length });

    const samples = new Map<string, unknown[]>();

    // Get samples in parallel
    const promises = columns.map(async (col) => {
      const sampleValues = await this.getSampleValues(col.name, col.type);
      samples.set(col.name, sampleValues);
    });

    await Promise.all(promises);

    logger.log('Sample values extracted successfully', { columnsProcessed: columns.length });

    return samples;
  }
}
