import type { TableSample } from '@buster/data-source';
import { logger } from '@trigger.dev/sdk';
import duckdb from 'duckdb';

/**
 * DuckDB connection manager for in-memory statistical analysis
 */
export class DuckDBManager {
  private db: duckdb.Database | null = null;
  private connection: duckdb.Connection | null = null;
  private tableName = 'sample_data';

  /**
   * Initialize DuckDB in-memory database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.log('Initializing DuckDB in-memory database');

        // Create in-memory database
        this.db = new duckdb.Database(':memory:', (err) => {
          if (err) {
            logger.error('Failed to create DuckDB database', { error: err.message });
            reject(err);
            return;
          }

          // Create connection
          try {
            this.connection = this.db!.connect();
            logger.log('DuckDB initialized successfully');
            resolve();
          } catch (connectError) {
            logger.error('Failed to create DuckDB connection', {
              error: connectError instanceof Error ? connectError.message : String(connectError),
            });
            reject(connectError);
          }
        });
      } catch (error) {
        logger.error('DuckDB initialization error', {
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
  }

  /**
   * Load sample data into DuckDB
   */
  async loadSampleData(sample: TableSample): Promise<void> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        logger.log('Loading sample data into DuckDB', {
          rows: sample.sampleSize,
          columns:
            sample.sampleData.length > 0 && sample.sampleData[0]
              ? Object.keys(sample.sampleData[0]).length
              : 0,
        });

        if (sample.sampleData.length === 0) {
          logger.warn('No sample data to load');
          resolve();
          return;
        }

        // Get column names and types from first row
        const firstRow = sample.sampleData[0];
        if (!firstRow || typeof firstRow !== 'object') {
          logger.warn('Invalid first row in sample data');
          resolve();
          return;
        }

        const columns = Object.keys(firstRow);

        // Infer column types by sampling multiple rows for better accuracy
        const columnDefinitions = columns
          .map((col) => {
            // Sample up to 100 rows to determine the best type
            const sampleSize = Math.min(100, sample.sampleData.length);
            let inferredType = 'VARCHAR';
            let hasNumbers = false;
            let hasIntegers = true;
            let hasBooleans = false;
            let hasDates = false;
            let hasStrings = false;
            let hasNulls = false;

            for (let i = 0; i < sampleSize; i++) {
              const value = sample.sampleData[i][col];

              if (value === null || value === undefined) {
                hasNulls = true;
                continue;
              }

              if (typeof value === 'number') {
                hasNumbers = true;
                if (!Number.isInteger(value)) {
                  hasIntegers = false;
                }
              } else if (typeof value === 'boolean') {
                hasBooleans = true;
              } else if (value instanceof Date) {
                hasDates = true;
              } else if (typeof value === 'string') {
                hasStrings = true;
                // Check if string could be a number
                if (!isNaN(Number(value)) && value !== '') {
                  hasNumbers = true;
                  if (!Number.isInteger(Number(value))) {
                    hasIntegers = false;
                  }
                }
              }
            }

            // Determine the most appropriate type
            if (hasDates) {
              inferredType = 'TIMESTAMP';
            } else if (hasBooleans && !hasNumbers && !hasStrings) {
              inferredType = 'BOOLEAN';
            } else if (hasNumbers && !hasStrings) {
              inferredType = hasIntegers ? 'BIGINT' : 'DOUBLE';
            } else {
              inferredType = 'VARCHAR';
            }

            // Escape column names with double quotes
            return `"${col}" ${inferredType}`;
          })
          .join(', ');

        // Create table
        const createTableSQL = `CREATE TABLE ${this.tableName} (${columnDefinitions})`;

        this.connection!.run(createTableSQL, (err) => {
          if (err) {
            logger.error('Failed to create DuckDB table', { error: err.message });
            reject(err);
            return;
          }

          // Insert data in batches for better performance
          const batchSize = 1000;
          let processed = 0;

          const insertBatch = (startIdx: number) => {
            const endIdx = Math.min(startIdx + batchSize, sample.sampleData.length);
            const batch = sample.sampleData.slice(startIdx, endIdx);

            if (batch.length === 0) {
              logger.log('Sample data loaded successfully', { totalRows: processed });
              resolve();
              return;
            }

            // Build insert statement with proper escaping
            const values = batch
              .map((row) => {
                return `(${columns
                  .map((col) => {
                    const val = row[col];
                    if (val === null || val === undefined) {
                      return 'NULL';
                    } else if (typeof val === 'string') {
                      // Escape single quotes in strings
                      return `'${val.replace(/'/g, "''")}'`;
                    } else if (typeof val === 'boolean') {
                      return val ? 'TRUE' : 'FALSE';
                    } else if (val instanceof Date) {
                      return `'${val.toISOString()}'`;
                    } else if (typeof val === 'object') {
                      return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    } else {
                      return String(val);
                    }
                  })
                  .join(', ')})`;
              })
              .join(', ');

            const insertSQL = `INSERT INTO ${this.tableName} VALUES ${values}`;

            this.connection!.run(insertSQL, (err) => {
              if (err) {
                logger.error('Failed to insert batch into DuckDB', {
                  error: err.message,
                  batchStart: startIdx,
                  batchEnd: endIdx,
                });
                reject(err);
                return;
              }

              processed = endIdx;

              // Process next batch
              insertBatch(endIdx);
            });
          };

          // Start batch insertion
          insertBatch(0);
        });
      } catch (error) {
        logger.error('Error loading sample data', {
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
  }

  /**
   * Convert BigInt values to numbers in an object
   */
  private convertBigInts(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (Array.isArray(obj)) return obj.map((item) => this.convertBigInts(item));
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = this.convertBigInts(obj[key]);
      }
      return converted;
    }
    return obj;
  }

  /**
   * Execute a SQL query and return results
   */
  async query<T = any>(sql: string): Promise<T[]> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    return new Promise((resolve, reject) => {
      this.connection!.all(sql, (err, result) => {
        if (err) {
          logger.error('DuckDB query error', { sql, error: err.message });
          reject(err);
          return;
        }
        // Convert any BigInt values to numbers to prevent serialization issues
        const converted = this.convertBigInts(result);
        resolve(converted as T[]);
      });
    });
  }

  /**
   * Get column information from the loaded table
   */
  async getColumnInfo(): Promise<Array<{ name: string; type: string }>> {
    const sql = `
      SELECT column_name as name, data_type as type
      FROM information_schema.columns
      WHERE table_name = '${this.tableName}'
      ORDER BY ordinal_position
    `;

    return this.query(sql);
  }

  /**
   * Get the table name for queries
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Clean up DuckDB resources
   */
  async cleanup(): Promise<void> {
    return new Promise((resolve) => {
      logger.log('Cleaning up DuckDB resources');

      if (this.connection) {
        this.connection.close((err) => {
          if (err) {
            logger.warn('Error closing DuckDB connection', { error: err.message });
          }
          this.connection = null;
        });
      }

      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.warn('Error closing DuckDB database', { error: err.message });
          }
          this.db = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
