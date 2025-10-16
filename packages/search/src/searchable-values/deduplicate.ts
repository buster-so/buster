/**
 * DuckDB-based deduplication for searchable values
 * Uses functional composition and Zod validation
 * DuckDB is lazy-loaded to avoid requiring it when not needed
 */

import { z } from 'zod';
import {
  createUniqueKey,
  type DeduplicationResult,
  DeduplicationResultSchema,
  type SearchableValue,
  SearchableValueSchema,
} from './types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DeduplicateInputSchema = z.object({
  existingKeys: z.array(z.string()),
  newValues: z.array(SearchableValueSchema),
});

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Batch array into chunks for processing
 */
export const batchArray = <T>(array: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Create SQL-safe string by escaping single quotes
 */
export const escapeSqlString = (str: string): string => {
  return str.replace(/'/g, "''");
};

/**
 * Format values for SQL IN clause
 */
export const formatSqlInClause = (values: string[]): string => {
  if (values.length === 0) return "('')"; // Empty set
  return values.map((v) => `'${escapeSqlString(v)}'`).join(',');
};

// ============================================================================
// DUCKDB CONNECTION MANAGEMENT
// ============================================================================

// Type definitions for lazy-loaded DuckDB module
// These match the actual DuckDB API but avoid direct import
interface DuckDBConnection {
  run(sql: string): Promise<DuckDBResult>;
  closeSync(): void;
}

interface DuckDBResult {
  getRowObjectsJson(): Promise<unknown[]>;
}

interface DuckDBInstance {
  connect(): Promise<DuckDBConnection>;
}

type DuckDBInstanceClass = {
  create(dbPath: string, config?: Record<string, string>): Promise<DuckDBInstance>;
};

let DuckDBModule: typeof import('@duckdb/node-api') | null = null;

/**
 * Lazy load DuckDB module only when needed
 * Throws an error if DuckDB is not installed (optional dependency)
 */
async function loadDuckDB(): Promise<typeof import('@duckdb/node-api')> {
  if (!DuckDBModule) {
    try {
      DuckDBModule = await import('@duckdb/node-api');
    } catch (_error) {
      throw new Error(
        'DuckDB is required for deduplication functionality but is not installed. ' +
          'Please install @duckdb/node-api to use deduplication features.'
      );
    }
  }
  return DuckDBModule;
}

export interface DuckDBContext {
  conn: DuckDBConnection;
  dbPath?: string; // Store path for cleanup only if using disk
}

/**
 * Create a DuckDB connection with optimized settings for large datasets
 * Uses disk storage for better memory management
 */
export const createConnection = async (useDisk = true): Promise<DuckDBContext> => {
  try {
    // Lazy load DuckDB when first connection is created
    const { DuckDBInstance: DuckDBInstanceClass } = (await loadDuckDB()) as {
      DuckDBInstance: DuckDBInstanceClass;
    };

    // Use disk storage for large datasets to avoid memory issues
    // The database file will be automatically cleaned up
    const dbPath = useDisk ? `/tmp/duckdb-dedupe-${Date.now()}.db` : ':memory:';

    const config: Record<string, string> = {};
    if (useDisk) {
      config.memory_limit = '2GB';
      config.threads = '4';
    }

    // Create instance and get connection
    // Instance will be garbage collected after connection is created
    const instance = await DuckDBInstanceClass.create(dbPath, config);
    const conn = await instance.connect();

    // Configure DuckDB for optimal performance with large datasets
    if (useDisk) {
      try {
        await conn.run("SET memory_limit='2GB'");
        await conn.run('SET threads=4');
      } catch (err) {
        console.warn('Failed to set DuckDB configuration:', err);
      }
    }

    const context: DuckDBContext = { conn };
    if (useDisk && dbPath !== ':memory:') {
      context.dbPath = dbPath;
    }
    return context;
  } catch (error) {
    throw new Error(
      `Failed to create DuckDB database: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Close DuckDB connection and clean up resources
 * Also cleans up temporary database files if using disk storage
 */
export const closeConnection = async (context: DuckDBContext): Promise<void> => {
  try {
    // Close connection synchronously
    context.conn.closeSync();

    // Clean up temporary database file if it exists
    if (context.dbPath && context.dbPath !== ':memory:') {
      const fs = await import('node:fs');
      try {
        // DuckDB creates additional WAL and temporary files
        const files = [context.dbPath, `${context.dbPath}.wal`, `${context.dbPath}.tmp`];

        for (const file of files) {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        }
      } catch (err) {
        console.warn(`Failed to clean up temporary DuckDB file: ${err}`);
      }
    }
  } catch (error) {
    console.warn('Error closing DuckDB connection:', error);
  }
};

/**
 * Execute a SQL query and return results
 */
export const executeQuery = async <T = unknown>(
  conn: DuckDBConnection,
  sql: string
): Promise<T[]> => {
  try {
    const result = await conn.run(sql);
    const reader = await result.getRowObjectsJson();
    return reader as T[];
  } catch (err) {
    throw new Error(
      `DuckDB query failed: ${err instanceof Error ? err.message : String(err)}\nSQL: ${sql}`
    );
  }
};

// ============================================================================
// DEDUPLICATION OPERATIONS
// ============================================================================

/**
 * Create and populate temporary tables for deduplication
 * Optimized for large datasets with increased batch sizes and indexes
 */
const setupTables = async (
  conn: DuckDBConnection,
  existingKeys: string[],
  newKeys: string[]
): Promise<void> => {
  // Create tables without primary key constraint initially for faster bulk loading
  await executeQuery(
    conn,
    `
    CREATE TABLE existing_keys (key VARCHAR)
  `
  );

  await executeQuery(
    conn,
    `
    CREATE TABLE new_keys (key VARCHAR)
  `
  );

  // Use larger batches for better performance with disk-based storage
  const BATCH_SIZE = 10000; // Increased from 1000 to 10000

  // Insert existing keys in batches
  if (existingKeys.length > 0) {
    console.info(`Inserting ${existingKeys.length} existing keys in batches of ${BATCH_SIZE}`);
    const batches = batchArray(existingKeys, BATCH_SIZE);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      const values = batch.map((key) => `('${escapeSqlString(key)}')`).join(',');
      await executeQuery(conn, `INSERT INTO existing_keys VALUES ${values}`);

      // Log progress for large datasets
      if (i > 0 && i % 10 === 0) {
        console.info(
          `Inserted ${Math.min((i + 1) * BATCH_SIZE, existingKeys.length)}/${existingKeys.length} existing keys`
        );
      }
    }
  }

  // Insert new keys in batches
  if (newKeys.length > 0) {
    console.info(`Inserting ${newKeys.length} new keys in batches of ${BATCH_SIZE}`);
    const batches = batchArray(newKeys, BATCH_SIZE);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      const values = batch.map((key) => `('${escapeSqlString(key)}')`).join(',');
      await executeQuery(conn, `INSERT INTO new_keys VALUES ${values}`);

      // Log progress for large datasets
      if (i > 0 && i % 10 === 0) {
        console.info(
          `Inserted ${Math.min((i + 1) * BATCH_SIZE, newKeys.length)}/${newKeys.length} new keys`
        );
      }
    }
  }

  // Create indexes after bulk loading for better query performance
  await executeQuery(conn, `CREATE INDEX idx_existing_keys ON existing_keys(key)`);
  await executeQuery(conn, `CREATE INDEX idx_new_keys ON new_keys(key)`);
};

/**
 * Find keys that exist only in new_keys table
 */
const findUniqueNewKeys = async (conn: DuckDBConnection): Promise<string[]> => {
  const result = await executeQuery<{ key: string }>(
    conn,
    `
    SELECT key FROM new_keys 
    WHERE key NOT IN (SELECT key FROM existing_keys)
    ORDER BY key
  `
  );

  return result.map((row) => row.key);
};

/**
 * Core deduplication logic using DuckDB
 * Automatically switches to disk-based storage for large datasets
 */
const performDeduplication = async (
  existingKeys: string[],
  newValues: SearchableValue[]
): Promise<{ uniqueValues: SearchableValue[]; duplicateCount: number }> => {
  // Early return for empty inputs
  if (newValues.length === 0) {
    return { uniqueValues: [], duplicateCount: 0 };
  }

  // Create key map for quick lookups
  const valuesByKey = new Map<string, SearchableValue>();
  const newKeys: string[] = [];

  for (const value of newValues) {
    const key = createUniqueKey(value);
    valuesByKey.set(key, value);
    newKeys.push(key);
  }

  // If no existing keys, all new values are unique
  if (existingKeys.length === 0) {
    return { uniqueValues: newValues, duplicateCount: 0 };
  }

  let context: DuckDBContext | null = null;

  try {
    // Determine whether to use disk based on dataset size
    // Use disk for large datasets to avoid memory issues
    const totalKeys = existingKeys.length + newKeys.length;
    const useDisk = totalKeys > 50000; // Switch to disk for datasets over 50k keys

    if (useDisk) {
      console.info(`Using disk-based DuckDB for deduplication (${totalKeys} total keys)`);
    }

    // Create DuckDB connection
    context = await createConnection(useDisk);

    // Setup tables and insert data
    await setupTables(context.conn, existingKeys, newKeys);

    // Find unique keys
    const uniqueKeys = await findUniqueNewKeys(context.conn);

    // Map unique keys back to values
    const uniqueValues = uniqueKeys
      .map((key) => valuesByKey.get(key))
      .filter((value): value is SearchableValue => value !== undefined);

    const duplicateCount = newValues.length - uniqueValues.length;

    return { uniqueValues, duplicateCount };
  } finally {
    // Always clean up connection
    if (context) {
      await closeConnection(context);
    }
  }
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Deduplicate searchable values against existing keys
 * Returns only values that don't already exist
 */
export const deduplicateValues = async (
  input: z.infer<typeof DeduplicateInputSchema>
): Promise<DeduplicationResult> => {
  // Validate input
  const validated = DeduplicateInputSchema.parse(input);

  // Perform deduplication
  const startTime = Date.now();
  const { uniqueValues, duplicateCount } = await performDeduplication(
    validated.existingKeys,
    validated.newValues
  );

  const processingTime = Date.now() - startTime;

  // Log performance metrics for large datasets
  if (validated.newValues.length > 1000) {
    console.info(
      `Deduplication completed: ${uniqueValues.length} new, ${duplicateCount} duplicates, ${processingTime}ms`
    );
  }

  // Return validated result
  return DeduplicationResultSchema.parse({
    newValues: uniqueValues,
    existingCount: validated.existingKeys.length,
    newCount: uniqueValues.length,
  });
};

/**
 * Check if specific values already exist
 * Useful for single value checks without full deduplication
 */
export const checkExistence = async (
  existingKeys: string[],
  valuesToCheck: SearchableValue[]
): Promise<Map<string, boolean>> => {
  const result = new Map<string, boolean>();

  if (valuesToCheck.length === 0 || existingKeys.length === 0) {
    // If no existing keys, nothing exists
    for (const value of valuesToCheck) {
      result.set(createUniqueKey(value), false);
    }
    return result;
  }

  // Use DuckDB for efficient set membership testing
  const { uniqueValues } = await performDeduplication(existingKeys, valuesToCheck);
  const uniqueKeys = new Set(uniqueValues.map(createUniqueKey));

  for (const value of valuesToCheck) {
    const key = createUniqueKey(value);
    result.set(key, !uniqueKeys.has(key));
  }

  return result;
};

/**
 * Get statistics about deduplication without returning values
 * Useful for dry-run or monitoring
 */
export const getDeduplicationStats = async (
  existingKeys: string[],
  newValues: SearchableValue[]
): Promise<{ total: number; unique: number; duplicate: number; percentage: number }> => {
  const { uniqueValues } = await performDeduplication(existingKeys, newValues);

  const total = newValues.length;
  const unique = uniqueValues.length;
  const duplicate = total - unique;
  const percentage = total > 0 ? (duplicate / total) * 100 : 0;

  return {
    total,
    unique,
    duplicate,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
  };
};
