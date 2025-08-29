import type { ColumnSchema, TableSample } from '@buster/data-source';
import {
  type DuckDBConnection,
  DuckDBInstance,
  type DuckDBPreparedStatement,
} from '@duckdb/node-api';
import { logger } from '@trigger.dev/sdk';
import { z } from 'zod';

/**
 * Type-safe SQL template tag for parameterized queries
 */
export class SQLQuery {
  constructor(
    public readonly sql: string,
    public readonly params: unknown[] = []
  ) {}

  static sql(strings: TemplateStringsArray, ...values: unknown[]): SQLQuery {
    let sql = '';
    const params: unknown[] = [];

    for (let i = 0; i < strings.length; i++) {
      sql += strings[i];
      if (i < values.length) {
        sql += '?';
        params.push(values[i]);
      }
    }

    return new SQLQuery(sql, params);
  }
}

/**
 * Type-safe query result schemas
 */
const QueryResultSchemas = {
  columnInfo: z.array(
    z
      .object({
        name: z.string(),
        type: z.string(),
      })
      .strict()
  ),

  count: z.array(
    z.object({
      count: z.number(),
    })
  ),

  generic: z.array(z.record(z.unknown())),
} as const;

/**
 * Column type mapping for better type inference
 */
export enum DuckDBColumnType {
  BIGINT = 'BIGINT',
  DOUBLE = 'DOUBLE',
  VARCHAR = 'VARCHAR',
  BOOLEAN = 'BOOLEAN',
  TIMESTAMP = 'TIMESTAMP',
  DATE = 'DATE',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
}

/**
 * Type-safe column definition
 */
export interface ColumnDefinition {
  name: string;
  type: DuckDBColumnType;
  nullable?: boolean;
}

/**
 * Enhanced DuckDB manager with improved type safety and performance
 *
 * This class provides a wrapper around DuckDB's in-memory database functionality,
 * specifically optimized for performing statistical analysis on table samples.
 * It handles database lifecycle, data loading, and query execution with full type safety.
 */
export class DuckDBManager {
  private instance: DuckDBInstance | null = null;
  private connection: DuckDBConnection | null = null;
  private preparedStatements = new Map<string, DuckDBPreparedStatement>();
  private readonly tableName = 'sample_data';
  private columnDefinitions: ColumnDefinition[] = [];
  private readonly instanceId: string;

  constructor(instanceId?: string) {
    // Use provided ID or generate a unique one based on timestamp and random value
    this.instanceId = instanceId || `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Initialize DuckDB with configuration options
   */
  async initialize(options?: {
    threads?: number;
    memoryLimit?: string;
    useDisk?: boolean;
  }): Promise<void> {
    try {
      logger.log('Initializing DuckDB database', {
        ...options,
        mode: options?.useDisk ? 'disk' : 'memory',
      });

      // Create instance with configuration
      const config: Record<string, string> = {};
      if (options?.threads) {
        config.threads = options.threads.toString();
      }
      if (options?.memoryLimit) {
        config.memory_limit = options.memoryLimit;
      }

      // Use disk-based storage for large datasets with unique paths per instance
      // This leverages the 10GB disk space available in Trigger.dev
      const dbPath = options?.useDisk ? `/tmp/duckdb_stats_${this.instanceId}.db` : ':memory:';

      // Enable disk spilling for better memory management with unique temp directory
      if (options?.useDisk) {
        config.temp_directory = `/tmp/duckdb_temp_${this.instanceId}`;
        config.max_memory = options.memoryLimit || '2GB';
        // Enable out-of-core processing
        config.enable_external_access = 'true';
      }

      this.instance = await DuckDBInstance.create(dbPath, config);
      this.connection = await this.instance.connect();

      // Enable better performance settings
      await this.executeRaw('SET enable_progress_bar = false');
      // Optimize for bulk loading
      await this.executeRaw('SET preserve_insertion_order = false');
      // Increase memory limit for JSON parsing if not already set
      if (!options?.memoryLimit) {
        await this.executeRaw("SET memory_limit = '2GB'");
      }

      logger.log('DuckDB initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DuckDB', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `DuckDB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load sample data with column schema from data source
   */
  async loadSampleData(sample: TableSample): Promise<void> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    if (!sample.sampleData || sample.sampleData.length === 0) {
      logger.warn('No sample data to load into DuckDB');
      return;
    }

    try {
      const firstRow = sample.sampleData[0];
      if (!firstRow) {
        logger.warn('Sample data is empty');
        return;
      }

      const startTime = Date.now();
      logger.log('Loading sample data into DuckDB', {
        rows: sample.sampleData.length,
        columns: Object.keys(firstRow).length,
        hasColumnSchemas: !!sample.columnSchemas,
      });

      // Choose loading strategy based on data size and complexity
      const rowCount = sample.sampleData.length;

      // Column schemas should be provided from data source
      if (sample.columnSchemas && sample.columnSchemas.length > 0) {
        // Convert column schemas to our format
        this.columnDefinitions = this.convertColumnSchemas(sample.columnSchemas);
      } else {
        // This should not happen in production - schemas should always be provided
        throw new Error('Column schemas must be provided in TableSample');
      }

      // Use batch loading for efficiency
      if (rowCount > 100) {
        await this.loadViaBatchInsertWithSchema(sample.sampleData, this.columnDefinitions);
      } else {
        await this.createTable(this.columnDefinitions);
        await this.insertData(sample.sampleData, this.columnDefinitions);
      }

      const loadTime = Date.now() - startTime;
      logger.log('Sample data loaded successfully', {
        totalRows: sample.sampleData.length,
        loadTimeMs: loadTime,
        method: rowCount > 100000 ? 'json' : rowCount > 100 ? 'batch' : 'individual',
      });
    } catch (error) {
      // Check if this is a transaction error that needs connection reset
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTransactionError =
        errorMessage.includes('Current transaction is aborted') ||
        errorMessage.includes('TransactionContext Error');

      if (isTransactionError) {
        logger.warn('Transaction error detected, attempting to reset connection', {
          error: errorMessage,
        });

        // Try to rollback any pending transaction
        try {
          await this.executeRaw('ROLLBACK');
        } catch (rollbackError) {
          logger.warn('Failed to rollback transaction', {
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }

        // Reset the connection state
        try {
          // Close and recreate the connection
          if (this.connection) {
            try {
              this.connection.closeSync();
            } catch {
              // Ignore close errors
            }
            this.connection = null;
          }

          if (this.instance) {
            this.connection = await this.instance.connect();
            logger.log('Connection reset successfully, retrying data load');

            // Retry the load with smaller batches
            await this.loadViaBatchInsertWithSchema(sample.sampleData, this.columnDefinitions);

            logger.log('Data loaded successfully after connection reset');
            return;
          }
        } catch (resetError) {
          logger.error('Failed to reset connection', {
            error: resetError instanceof Error ? resetError.message : String(resetError),
          });
        }
      }

      logger.error('Error loading sample data', {
        error: errorMessage,
      });
      throw new Error(`Failed to load sample data: ${errorMessage}`);
    }
  }

  /**
   * Convert column schemas from data source to DuckDB column definitions
   */
  private convertColumnSchemas(schemas: ColumnSchema[]): ColumnDefinition[] {
    return schemas.map((schema) => ({
      name: schema.name,
      type: this.mapDataSourceTypeToDuckDB(schema.type),
      nullable: schema.nullable ?? true,
    }));
  }

  /**
   * Map data source types to DuckDB types
   */
  private mapDataSourceTypeToDuckDB(sourceType: string): DuckDBColumnType {
    const upperType = sourceType.toUpperCase();

    // Handle common database type mappings
    if (
      upperType.includes('VARCHAR') ||
      upperType.includes('TEXT') ||
      upperType.includes('STRING') ||
      upperType.includes('CHAR')
    ) {
      return DuckDBColumnType.VARCHAR;
    }
    if (upperType.includes('INT') || upperType.includes('SERIAL')) {
      return DuckDBColumnType.BIGINT;
    }
    if (upperType.includes('FLOAT') || upperType.includes('REAL')) {
      return DuckDBColumnType.DOUBLE;
    }
    if (upperType.includes('DOUBLE') || upperType.includes('PRECISION')) {
      return DuckDBColumnType.DOUBLE;
    }
    if (
      upperType.includes('DECIMAL') ||
      upperType.includes('NUMERIC') ||
      upperType.includes('NUMBER')
    ) {
      return DuckDBColumnType.DECIMAL;
    }
    if (upperType.includes('BOOL')) {
      return DuckDBColumnType.BOOLEAN;
    }
    if (upperType.includes('TIMESTAMP') || upperType.includes('DATETIME')) {
      return DuckDBColumnType.TIMESTAMP;
    }
    if (upperType.includes('DATE')) {
      return DuckDBColumnType.DATE;
    }

    // Default to VARCHAR for unknown types
    return DuckDBColumnType.VARCHAR;
  }

  /**
   * Load data using batch INSERT with predefined schema
   */
  private async loadViaBatchInsertWithSchema(
    data: Record<string, unknown>[],
    definitions: ColumnDefinition[]
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    // Create table with exact schema
    await this.createTable(definitions);

    // Determine optimal batch size
    const estimatedRowSize = JSON.stringify(data[0] || {}).length;
    const optimalBatchSize = estimatedRowSize > 1000 ? 500 : estimatedRowSize > 500 ? 1000 : 2000;

    const columns = definitions.map((d) => d.name);
    const columnNames = columns.map((c) => `"${this.escapeIdentifier(c)}"`).join(', ');

    // Use transaction for better performance
    await this.executeRaw('BEGIN TRANSACTION');

    try {
      for (let i = 0; i < data.length; i += optimalBatchSize) {
        const batch = data.slice(i, Math.min(i + optimalBatchSize, data.length));

        // Build multi-row VALUES clause
        const valueRows = batch
          .map((row) => {
            const values = columns.map((col) => {
              const value = row[col];
              return this.formatValueForSQL(value);
            });
            return `(${values.join(', ')})`;
          })
          .join(', ');

        const insertSQL = `INSERT INTO ${this.tableName} (${columnNames}) VALUES ${valueRows}`;

        try {
          await this.executeRaw(insertSQL);
        } catch (error) {
          logger.warn('Batch insert with schema failed, trying smaller batch', {
            batchIndex: i / optimalBatchSize,
            error: error instanceof Error ? error.message : String(error),
          });

          // Rollback and retry with smaller batches
          await this.executeRaw('ROLLBACK');
          await this.executeRaw('BEGIN TRANSACTION');

          // Retry with smaller batches
          const smallerBatchSize = Math.max(10, Math.floor(batch.length / 10));
          for (let j = 0; j < batch.length; j += smallerBatchSize) {
            const smallBatch = batch.slice(j, Math.min(j + smallerBatchSize, batch.length));
            const smallValueRows = smallBatch
              .map((row) => {
                const values = columns.map((col) => {
                  const value = row[col];
                  return this.formatValueForSQL(value);
                });
                return `(${values.join(', ')})`;
              })
              .join(', ');

            const smallInsertSQL = `INSERT INTO ${this.tableName} (${columnNames}) VALUES ${smallValueRows}`;

            try {
              await this.executeRaw(smallInsertSQL);
            } catch (smallBatchError) {
              logger.error('Small batch insert failed, skipping rows', {
                error:
                  smallBatchError instanceof Error
                    ? smallBatchError.message
                    : String(smallBatchError),
              });
              // Skip these rows and continue
            }
          }
        }
      }

      // Commit transaction
      await this.executeRaw('COMMIT');
    } catch (error) {
      // Rollback on error
      try {
        await this.executeRaw('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', {
          error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
        });
      }
      throw error;
    }
  }

  /**
   * Format a value for use in SQL VALUES clause
   */
  private formatValueForSQL(value: unknown): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      // Escape single quotes and wrap in quotes
      return `'${value.replace(/'/g, "''")}'`;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    // For complex objects, convert to JSON string
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  /**
   * Map DuckDB type string to our enum
   */
  private mapDuckDBTypeToEnum(typeStr: string): DuckDBColumnType {
    const upperType = typeStr.toUpperCase();

    if (upperType.includes('INT')) return DuckDBColumnType.BIGINT;
    if (upperType.includes('DOUBLE') || upperType.includes('FLOAT')) return DuckDBColumnType.DOUBLE;
    if (upperType.includes('DECIMAL') || upperType.includes('NUMERIC'))
      return DuckDBColumnType.DECIMAL;
    if (upperType.includes('BOOL')) return DuckDBColumnType.BOOLEAN;
    if (upperType.includes('TIMESTAMP')) return DuckDBColumnType.TIMESTAMP;
    if (upperType.includes('DATE')) return DuckDBColumnType.DATE;

    return DuckDBColumnType.VARCHAR;
  }

  /**
   * Create table with proper column definitions
   */
  private async createTable(definitions: ColumnDefinition[]): Promise<void> {
    const columnDefs = definitions
      .map((def) => `"${this.escapeIdentifier(def.name)}" ${def.type}`)
      .join(', ');

    const sql = `CREATE TABLE ${this.tableName} (${columnDefs})`;
    await this.executeRaw(sql);
  }

  /**
   * Insert data using prepared statements for better performance
   */
  private async insertData(
    data: Record<string, unknown>[],
    definitions: ColumnDefinition[]
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    const columns = definitions.map((d) => d.name);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.map((c) => `"${this.escapeIdentifier(c)}"`).join(', ');
    const insertSQL = `INSERT INTO ${this.tableName} (${columnNames}) VALUES (${placeholders})`;

    const prepared = await this.connection.prepare(insertSQL);
    const batchSize = 1000;

    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));

        for (const row of batch) {
          for (let colIndex = 0; colIndex < definitions.length; colIndex++) {
            const def = definitions[colIndex];
            if (!def) continue;

            const value = row[def.name];
            const position = colIndex + 1;

            this.bindValue(prepared, position, value, def.type);
          }

          await prepared.run();
        }
      }
    } finally {
      // Prepared statements are automatically cleaned up
    }
  }

  /**
   * Bind value to prepared statement with proper type handling
   */
  private bindValue(
    prepared: DuckDBPreparedStatement,
    position: number,
    value: unknown,
    type: DuckDBColumnType
  ): void {
    if (value === null || value === undefined) {
      prepared.bindNull(position);
      return;
    }

    switch (type) {
      case DuckDBColumnType.BIGINT:
      case DuckDBColumnType.INTEGER:
        if (typeof value === 'number') {
          prepared.bindInteger(position, Math.floor(value));
        } else if (typeof value === 'string') {
          prepared.bindInteger(position, Number.parseInt(value, 10));
        } else {
          prepared.bindNull(position);
        }
        break;

      case DuckDBColumnType.DOUBLE:
      case DuckDBColumnType.DECIMAL:
        if (typeof value === 'number') {
          prepared.bindDouble(position, value);
        } else if (typeof value === 'string') {
          prepared.bindDouble(position, Number.parseFloat(value));
        } else {
          prepared.bindNull(position);
        }
        break;

      case DuckDBColumnType.BOOLEAN:
        if (typeof value === 'boolean') {
          prepared.bindBoolean(position, value);
        } else {
          prepared.bindBoolean(position, Boolean(value));
        }
        break;

      case DuckDBColumnType.TIMESTAMP:
      case DuckDBColumnType.DATE:
        if (value instanceof Date) {
          prepared.bindVarchar(position, value.toISOString());
        } else if (typeof value === 'string') {
          prepared.bindVarchar(position, value);
        } else {
          prepared.bindNull(position);
        }
        break;

      default:
        if (typeof value === 'object') {
          prepared.bindVarchar(position, JSON.stringify(value));
        } else {
          prepared.bindVarchar(position, String(value));
        }
        break;
    }
  }

  /**
   * Execute raw SQL (for DDL operations)
   */
  private async executeRaw(sql: string): Promise<void> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    await this.connection.run(sql);
  }

  /**
   * Escape identifier to prevent SQL injection
   */
  private escapeIdentifier(identifier: string): string {
    return identifier.replace(/"/g, '""');
  }

  /**
   * Type-safe query execution with schema validation
   */
  async queryWithSchema<Out>(sql: string | SQLQuery, schema: z.ZodType<Out>): Promise<Out> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    try {
      let result: Awaited<ReturnType<DuckDBConnection['run']>>;

      if (sql instanceof SQLQuery) {
        // Use parameterized query
        const prepared = await this.connection.prepare(sql.sql);
        for (let i = 0; i < sql.params.length; i++) {
          const param = sql.params[i];
          const position = i + 1;

          if (param === null || param === undefined) {
            prepared.bindNull(position);
          } else if (typeof param === 'number') {
            if (Number.isInteger(param)) {
              prepared.bindInteger(position, param);
            } else {
              prepared.bindDouble(position, param);
            }
          } else if (typeof param === 'boolean') {
            prepared.bindBoolean(position, param);
          } else {
            prepared.bindVarchar(position, String(param));
          }
        }
        result = await prepared.run();
      } else {
        result = await this.connection.run(sql);
      }

      const reader = await result.getRowObjectsJson();
      const rows = this.processQueryResults(reader);

      // Validate against schema
      const validated = schema.parse(rows) as Out;
      return validated;
    } catch (error) {
      logger.error('DuckDB query error', {
        sql: sql instanceof SQLQuery ? sql.sql : sql,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Legacy query method for backward compatibility
   * @deprecated Use queryWithSchema for type safety
   */
  async query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    if (!this.connection) {
      throw new Error('DuckDB not initialized');
    }

    try {
      const result = await this.connection.run(sql);
      const reader = await result.getRowObjectsJson();
      const rows = this.processQueryResults(reader);
      return rows as T[];
    } catch (error) {
      logger.error('DuckDB query error', {
        sql,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process query results with proper type conversion
   */
  private processQueryResults(reader: Record<string, unknown>[]): unknown[] {
    return reader.map((row: Record<string, unknown>) => {
      const processed: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(row)) {
        processed[key] = this.convertValue(value);
      }

      return processed;
    });
  }

  /**
   * Convert values with proper type handling
   */
  private convertValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'bigint') {
      // Convert BigInt to number if safe, otherwise to string
      if (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER) {
        return Number(value);
      }
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.convertValue(item));
    }

    if (typeof value === 'object') {
      const converted: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        converted[k] = this.convertValue(v);
      }
      return converted;
    }

    // Handle numeric strings
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // Check if it's a valid number (but not a date/timestamp)
      if (trimmed !== '' && !trimmed.includes('T') && !trimmed.includes(':')) {
        const numValue = Number(trimmed);
        if (!Number.isNaN(numValue)) {
          return numValue;
        }
      }
    }

    return value;
  }

  /**
   * Convert BigInt values to numbers in an object (legacy helper)
   */
  private convertBigInts(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (Array.isArray(obj)) return obj.map((item) => this.convertBigInts(item));
    if (typeof obj === 'object') {
      const converted: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        converted[key] = this.convertBigInts((obj as Record<string, unknown>)[key]);
      }
      return converted;
    }
    return obj;
  }

  /**
   * Get column information with type safety
   */
  async getColumnInfo(): Promise<z.infer<typeof QueryResultSchemas.columnInfo>> {
    const sql = `
      SELECT column_name as name, data_type as type
      FROM information_schema.columns
      WHERE table_name = '${this.tableName}'
      ORDER BY ordinal_position
    `;

    const raw = await this.queryWithSchema(sql, QueryResultSchemas.generic);
    const rows = raw.map((r): { name: string; type: string } => ({
      name: String((r as Record<string, unknown>).name ?? ''),
      type: String((r as Record<string, unknown>).type ?? ''),
    }));
    return rows;
  }

  /**
   * Get row count with type safety
   */
  async getRowCount(): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = await this.queryWithSchema(sql, QueryResultSchemas.count);
    return result[0]?.count ?? 0;
  }

  /**
   * Get the table name for queries
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Get escaped table name for safe SQL construction
   */
  getEscapedTableName(): string {
    return `"${this.escapeIdentifier(this.tableName)}"`;
  }

  /**
   * Get column definitions
   */
  getColumnDefinitions(): ColumnDefinition[] {
    return [...this.columnDefinitions];
  }

  /**
   * Clean up DuckDB resources with proper error handling
   */
  async cleanup(): Promise<void> {
    logger.log('Cleaning up DuckDB resources', { instanceId: this.instanceId });

    const errors: Error[] = [];

    try {
      // Clear prepared statements
      this.preparedStatements.clear();

      // Close connection
      if (this.connection) {
        try {
          this.connection.closeSync();
        } catch (error) {
          errors.push(
            new Error(
              `Failed to close connection: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
        this.connection = null;
      }

      // Clean up instance
      if (this.instance) {
        this.instance = null;
      }

      // Clean up disk-based files if they exist
      try {
        const fs = await import('node:fs/promises');
        const filesToClean = [
          `/tmp/duckdb_stats_${this.instanceId}.db`,
          `/tmp/duckdb_stats_${this.instanceId}.db.wal`,
          `/tmp/duckdb_temp_${this.instanceId}`,
        ];

        for (const file of filesToClean) {
          try {
            await fs.rm(file, { recursive: true, force: true });
            logger.log(`Cleaned up disk file: ${file}`);
          } catch {
            // File might not exist, that's okay
          }
        }
      } catch (cleanupError) {
        logger.warn('Failed to clean up disk files', {
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }

      if (errors.length > 0) {
        logger.warn('Errors during DuckDB cleanup', {
          instanceId: this.instanceId,
          errors: errors.map((e) => e.message),
        });
      } else {
        logger.log('DuckDB resources cleaned up successfully', { instanceId: this.instanceId });
      }
    } catch (error) {
      logger.error('Critical error during DuckDB cleanup', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
