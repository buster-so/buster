/**
 * Parquet-based caching for searchable values using DuckDB and R2 storage
 * Provides efficient storage and comparison of distinct column values
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getDefaultProvider, type StorageProvider } from '@buster/data-source';
import { closeConnection, createConnection, type DuckDBContext, executeQuery } from './deduplicate';
import type { SearchableValue } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ParquetCacheResult {
  existingValues: string[];
  newValues: string[];
  totalValues: number;
  cacheHit: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate MD5 hash for column identification
 * Creates a deterministic key for R2 storage path
 */
export function generateColumnHash(
  database: string,
  schema: string,
  table: string,
  column: string
): string {
  const key = `${database}:${schema}:${table}:${column}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

/**
 * Generate R2 storage key for parquet file
 */
export function generateStorageKey(dataSourceId: string, columnHash: string): string {
  return `searchable-values/${dataSourceId}/${columnHash}.parquet`;
}

/**
 * Create a temporary file path for local parquet operations
 */
function getTempFilePath(prefix: string): string {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return path.join(tempDir, `${prefix}-${timestamp}-${randomId}.parquet`);
}

/**
 * Clean up temporary file
 */
async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${filePath}:`, error);
  }
}

// ============================================================================
// PARQUET OPERATIONS
// ============================================================================

/**
 * Export values to a parquet file using DuckDB
 */
export async function exportValuesToParquet(values: string[], outputPath: string): Promise<void> {
  if (values.length === 0) {
    throw new Error('Cannot export empty values to parquet');
  }

  let context: DuckDBContext | null = null;

  try {
    // Create DuckDB connection (in-memory for this operation)
    context = await createConnection(false);

    // Create table with values
    await executeQuery(context.conn, `CREATE TABLE values_table (value VARCHAR)`);

    // Insert values in batches for better performance
    const BATCH_SIZE = 10000;
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);
      const valuesClause = batch.map((v) => `('${v.replace(/'/g, "''")}')`).join(',');

      await executeQuery(context.conn, `INSERT INTO values_table VALUES ${valuesClause}`);
    }

    // Export to parquet file
    await executeQuery(
      context.conn,
      `COPY (SELECT DISTINCT value FROM values_table ORDER BY value) 
       TO '${outputPath}' (FORMAT PARQUET, COMPRESSION 'SNAPPY')`
    );

    console.info(`Exported ${values.length} values to parquet: ${outputPath}`);
  } finally {
    if (context) {
      await closeConnection(context);
    }
  }
}

/**
 * Read values from a parquet file using DuckDB
 */
export async function readValuesFromParquet(filePath: string): Promise<string[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Parquet file not found: ${filePath}`);
  }

  let context: DuckDBContext | null = null;

  try {
    // Create DuckDB connection (in-memory for this operation)
    context = await createConnection(false);

    // Read parquet file
    const result = await executeQuery<{ value: string }>(
      context.conn,
      `SELECT value FROM read_parquet('${filePath}') ORDER BY value`
    );

    const values = result.map((row) => row.value);
    console.info(`Read ${values.length} values from parquet: ${filePath}`);

    return values;
  } finally {
    if (context) {
      await closeConnection(context);
    }
  }
}

/**
 * Compare two sets of values and find new ones using DuckDB
 * Returns values that exist in current but not in existing
 */
export async function findNewValues(
  existingValues: string[],
  currentValues: string[]
): Promise<string[]> {
  // Early return if no existing values (all are new)
  if (existingValues.length === 0) {
    return currentValues;
  }

  // Early return if no current values
  if (currentValues.length === 0) {
    return [];
  }

  let context: DuckDBContext | null = null;

  try {
    // Use disk-based DuckDB for large datasets
    const totalValues = existingValues.length + currentValues.length;
    const useDisk = totalValues > 50000;

    context = await createConnection(useDisk);

    // Create tables
    await executeQuery(context.conn, `CREATE TABLE existing_values (value VARCHAR)`);
    await executeQuery(context.conn, `CREATE TABLE current_values (value VARCHAR)`);

    // Insert values in batches
    const BATCH_SIZE = 10000;

    // Insert existing values
    for (let i = 0; i < existingValues.length; i += BATCH_SIZE) {
      const batch = existingValues.slice(i, i + BATCH_SIZE);
      const valuesClause = batch.map((v) => `('${v.replace(/'/g, "''")}')`).join(',');

      await executeQuery(context.conn, `INSERT INTO existing_values VALUES ${valuesClause}`);
    }

    // Insert current values
    for (let i = 0; i < currentValues.length; i += BATCH_SIZE) {
      const batch = currentValues.slice(i, i + BATCH_SIZE);
      const valuesClause = batch.map((v) => `('${v.replace(/'/g, "''")}')`).join(',');

      await executeQuery(context.conn, `INSERT INTO current_values VALUES ${valuesClause}`);
    }

    // Create indexes for better performance
    await executeQuery(context.conn, `CREATE INDEX idx_existing ON existing_values(value)`);
    await executeQuery(context.conn, `CREATE INDEX idx_current ON current_values(value)`);

    // Find new values (in current but not in existing)
    const result = await executeQuery<{ value: string }>(
      context.conn,
      `SELECT DISTINCT value FROM current_values
       WHERE value NOT IN (SELECT value FROM existing_values)
       ORDER BY value`
    );

    const newValues = result.map((row) => row.value);
    console.info(`Found ${newValues.length} new values out of ${currentValues.length} total`);

    return newValues;
  } finally {
    if (context) {
      await closeConnection(context);
    }
  }
}

// ============================================================================
// R2 CACHE OPERATIONS
// ============================================================================

/**
 * Download parquet cache from R2 if it exists
 * Returns null if cache doesn't exist
 */
export async function downloadParquetCache(
  storageProvider: StorageProvider,
  dataSourceId: string,
  database: string,
  schema: string,
  table: string,
  column: string
): Promise<string[] | null> {
  const columnHash = generateColumnHash(database, schema, table, column);
  const storageKey = generateStorageKey(dataSourceId, columnHash);

  try {
    // Check if file exists in R2
    const exists = await storageProvider.exists(storageKey);
    if (!exists) {
      console.info(`No cached parquet found for ${storageKey}`);
      return null;
    }

    // Download parquet file
    const downloadResult = await storageProvider.download(storageKey);
    if (!downloadResult.success || !downloadResult.data) {
      console.warn(`Failed to download parquet cache: ${downloadResult.error}`);
      return null;
    }

    // Save to temp file
    const tempPath = getTempFilePath('cache-download');
    fs.writeFileSync(tempPath, downloadResult.data);

    try {
      // Read values from parquet
      const values = await readValuesFromParquet(tempPath);
      console.info(`Downloaded and read ${values.length} cached values from R2`);
      return values;
    } finally {
      // Clean up temp file
      await cleanupTempFile(tempPath);
    }
  } catch (error) {
    console.error(`Error downloading parquet cache for ${storageKey}:`, error);
    return null;
  }
}

/**
 * Upload parquet cache to R2
 */
export async function uploadParquetCache(
  storageProvider: StorageProvider,
  dataSourceId: string,
  database: string,
  schema: string,
  table: string,
  column: string,
  values: string[]
): Promise<boolean> {
  const columnHash = generateColumnHash(database, schema, table, column);
  const storageKey = generateStorageKey(dataSourceId, columnHash);

  const tempPath = getTempFilePath('cache-upload');

  try {
    // Export values to parquet
    await exportValuesToParquet(values, tempPath);

    // Read file for upload
    const fileBuffer = fs.readFileSync(tempPath);

    // Upload to R2
    const uploadResult = await storageProvider.upload(storageKey, fileBuffer, {
      contentType: 'application/octet-stream',
      metadata: {
        'data-source-id': dataSourceId,
        database: database,
        schema: schema,
        table: table,
        column: column,
        'value-count': String(values.length),
        'updated-at': new Date().toISOString(),
      },
    });

    if (uploadResult.success) {
      console.info(`Successfully uploaded ${values.length} values to R2: ${storageKey}`);
      return true;
    }
    console.error(`Failed to upload parquet cache: ${uploadResult.error}`);
    return false;
  } catch (error) {
    console.error(`Error uploading parquet cache for ${storageKey}:`, error);
    return false;
  } finally {
    // Clean up temp file
    await cleanupTempFile(tempPath);
  }
}

/**
 * Process searchable values with parquet caching
 * This is the main entry point for the caching logic
 */
export async function processWithCache(
  dataSourceId: string,
  database: string,
  schema: string,
  table: string,
  column: string,
  currentValues: string[],
  storageProvider?: StorageProvider
): Promise<ParquetCacheResult> {
  // Use provided storage provider or get default R2
  const storage = storageProvider || getDefaultProvider();

  // Try to download existing cache
  const cachedValues = await downloadParquetCache(
    storage,
    dataSourceId,
    database,
    schema,
    table,
    column
  );

  if (!cachedValues) {
    // No cache exists - all values are new
    console.info(`No cache found - all ${currentValues.length} values are new`);
    return {
      existingValues: [],
      newValues: currentValues,
      totalValues: currentValues.length,
      cacheHit: false,
    };
  }

  // Cache exists - find only new values
  console.info(`Cache found with ${cachedValues.length} existing values`);
  const newValues = await findNewValues(cachedValues, currentValues);

  return {
    existingValues: cachedValues,
    newValues,
    totalValues: currentValues.length,
    cacheHit: true,
  };
}

/**
 * Update cache after successful sync
 * Uploads the complete set of values (existing + new) to R2
 */
export async function updateCache(
  dataSourceId: string,
  database: string,
  schema: string,
  table: string,
  column: string,
  allValues: string[],
  storageProvider?: StorageProvider
): Promise<boolean> {
  // Use provided storage provider or get default R2
  const storage = storageProvider || getDefaultProvider();

  return uploadParquetCache(storage, dataSourceId, database, schema, table, column, allValues);
}

// ============================================================================
// FUTURE ENHANCEMENT NOTE
// ============================================================================
/**
 * Future enhancement: Customer bucket integration
 *
 * To support customer buckets, update processWithCache and updateCache to:
 * 1. Use getProviderForOrganization(organizationId) instead of getDefaultProvider()
 * 2. This will automatically check for customer S3/R2/GCS integration
 * 3. Fall back to default R2 if no customer integration exists
 *
 * Example:
 * ```typescript
 * import { getProviderForOrganization } from '@buster/data-source/storage';
 * const storage = await getProviderForOrganization(organizationId);
 * ```
 */
