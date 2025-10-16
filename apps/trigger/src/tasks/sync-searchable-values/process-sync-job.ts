import { generateSearchableValueEmbeddings } from '@buster/ai';
import { createAdapter, type DatabaseAdapter, getDefaultProvider } from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database/queries';
import {
  processWithCache,
  type SearchableValue,
  updateCache,
  upsertSearchableValues,
} from '@buster/search';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { type SyncJobPayload, SyncJobPayloadSchema, type SyncJobResult } from './types';

/**
 * Task to process an individual searchable values sync job
 *
 * This task orchestrates the complete sync workflow:
 * 1. Fetches credentials and connects to the data source
 * 2. Queries distinct values from the specified column
 * 3. Uses R2-based parquet cache to find existing vs new values
 * 4. Generates embeddings only for new values
 * 5. Upserts new values with embeddings to Turbopuffer
 * 6. Updates parquet cache with complete set of values
 * 7. Updates sync job and column metadata
 */
export const processSyncJob: ReturnType<
  typeof schemaTask<'process-sync-job', typeof SyncJobPayloadSchema, SyncJobResult>
> = schemaTask({
  id: 'process-sync-job',
  schema: SyncJobPayloadSchema,
  maxDuration: 1200, // 20 minutes per job
  machine: {
    preset: 'large-1x', // 4 vCPU, 8 GB RAM for handling large datasets
  },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload): Promise<SyncJobResult> => {
    const startTime = Date.now();

    // Use datasetId for logging
    const identifier = payload.datasetId || 'unknown';
    const identifierType = 'datasetId';

    logger.info('Starting sync job processing', {
      [identifierType]: identifier,
      datasetName: payload.datasetName,
      dataSourceId: payload.dataSourceId,
      column: {
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
      },
      maxValues: payload.maxValues || 'no limit',
    });

    let adapter: DatabaseAdapter | null = null;

    try {
      // Step 1: Get data source credentials
      logger.info('Fetching data source credentials', { dataSourceId: payload.dataSourceId });
      const credentials = await getDataSourceCredentials({
        dataSourceId: payload.dataSourceId,
      });

      // Step 2: Create and connect adapter
      logger.info('Creating database adapter', { dataSourceId: payload.dataSourceId });
      // @ts-expect-error - credentials type is flexible across different database types
      adapter = await createAdapter(credentials);
      await adapter.testConnection();

      // Step 3: Query distinct values from the source column
      logger.info('Querying distinct values from source', {
        table: `${payload.databaseName}.${payload.schemaName}.${payload.tableName}`,
        column: payload.columnName,
        limit: payload.maxValues || 'no limit',
      });

      const distinctValues = await queryDistinctColumnValues({
        adapter,
        databaseName: payload.databaseName,
        schemaName: payload.schemaName,
        tableName: payload.tableName,
        columnName: payload.columnName,
        ...(payload.maxValues && { limit: payload.maxValues }), // Only include limit if provided
      });

      logger.info('Retrieved distinct values', {
        [identifierType]: identifier,
        totalValues: distinctValues.length,
      });

      if (distinctValues.length === 0) {
        // No values to sync
        const result: SyncJobResult = {
          datasetId: payload.datasetId,
          success: true,
          processedCount: 0,
          existingCount: 0,
          newCount: 0,
          duration: Date.now() - startTime,
        };

        logger.info('No values to sync', { [identifierType]: identifier });
        return result;
      }

      // Step 4: Use parquet cache to find existing and new values
      // This replaces the Turbopuffer query with R2-based caching
      logger.info('Processing with parquet cache', {
        [identifierType]: identifier,
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
      });

      // Get storage provider (default R2)
      const storageProvider = getDefaultProvider();

      // Process with cache to find new vs existing values
      const cacheResult = await processWithCache(
        payload.dataSourceId,
        payload.databaseName,
        payload.schemaName,
        payload.tableName,
        payload.columnName,
        distinctValues,
        storageProvider
      );

      logger.info('Cache processing complete', {
        [identifierType]: identifier,
        cacheHit: cacheResult.cacheHit,
        existingCount: cacheResult.existingValues.length,
        newCount: cacheResult.newValues.length,
        totalCount: cacheResult.totalValues,
      });

      // Step 5: Check if there are any new values to process
      if (cacheResult.newValues.length === 0) {
        // All values already exist
        const result: SyncJobResult = {
          datasetId: payload.datasetId,
          success: true,
          processedCount: distinctValues.length,
          existingCount: cacheResult.existingValues.length,
          newCount: 0,
          duration: Date.now() - startTime,
        };

        logger.info('All values already exist (cache hit)', { [identifierType]: identifier });
        return result;
      }

      // Step 6: Prepare searchable values for new values only
      const newSearchableValues: SearchableValue[] = cacheResult.newValues.map((value) => ({
        database: payload.databaseName,
        schema: payload.schemaName,
        table: payload.tableName,
        column: payload.columnName,
        value,
      }));

      // Step 7: Generate embeddings for new values in batches to manage memory
      logger.info('Generating embeddings for new values', {
        [identifierType]: identifier,
        newCount: cacheResult.newValues.length,
      });

      // Process embeddings in batches with concurrency to improve performance
      const EMBEDDING_BATCH_SIZE = 1000; // Process 1000 values at a time
      const EMBEDDING_CONCURRENCY = 5; // Process up to 5 batches concurrently
      const allValuesWithEmbeddings: SearchableValue[] = [];

      // Create batches
      const embeddingBatches: SearchableValue[][] = [];
      for (let i = 0; i < newSearchableValues.length; i += EMBEDDING_BATCH_SIZE) {
        embeddingBatches.push(newSearchableValues.slice(i, i + EMBEDDING_BATCH_SIZE));
      }

      logger.info('Processing embeddings with concurrency', {
        [identifierType]: identifier,
        totalBatches: embeddingBatches.length,
        batchSize: EMBEDDING_BATCH_SIZE,
        concurrency: EMBEDDING_CONCURRENCY,
        totalValues: newSearchableValues.length,
      });

      // Process batches with controlled concurrency
      for (let i = 0; i < embeddingBatches.length; i += EMBEDDING_CONCURRENCY) {
        const concurrentBatches = embeddingBatches.slice(i, i + EMBEDDING_CONCURRENCY);

        logger.info('Processing concurrent embedding batch group', {
          [identifierType]: identifier,
          groupStart: i,
          groupSize: concurrentBatches.length,
          totalGroups: Math.ceil(embeddingBatches.length / EMBEDDING_CONCURRENCY),
        });

        // Process multiple batches concurrently
        const embeddingPromises = concurrentBatches.map(async (batch, batchIndex) => {
          const absoluteBatchIndex = i + batchIndex;
          const batchTexts = batch.map((v) => v.value);

          logger.info('Starting embedding batch', {
            [identifierType]: identifier,
            batchIndex: absoluteBatchIndex,
            batchSize: batch.length,
            totalBatches: embeddingBatches.length,
          });

          try {
            // Generate embeddings for this batch
            const batchEmbeddings = await generateSearchableValueEmbeddings(batchTexts);

            // Log embedding dimensions for first batch only
            if (absoluteBatchIndex === 0 && batchEmbeddings.length > 0 && batchEmbeddings[0]) {
              logger.info('Embedding dimensions check', {
                [identifierType]: identifier,
                firstEmbeddingLength: batchEmbeddings[0].length,
                expectedDimensions: 512,
                allEmbeddingLengths: batchEmbeddings.slice(0, 5).map((e) => e?.length),
              });
            }

            // Combine values with embeddings for this batch
            const batchWithEmbeddings = batch.map((value, index) => ({
              ...value,
              embedding: batchEmbeddings[index],
              synced_at: new Date().toISOString(),
            }));

            logger.info('Completed embedding batch', {
              [identifierType]: identifier,
              batchIndex: absoluteBatchIndex,
              processedCount: batchWithEmbeddings.length,
            });

            return batchWithEmbeddings;
          } catch (error) {
            logger.error('Failed to process embedding batch', {
              [identifierType]: identifier,
              batchIndex: absoluteBatchIndex,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        });

        // Wait for all concurrent batches to complete
        const results = await Promise.all(embeddingPromises);

        // Flatten and add to results
        for (const batchResult of results) {
          allValuesWithEmbeddings.push(...batchResult);
        }

        logger.info('Completed concurrent embedding batch group', {
          [identifierType]: identifier,
          groupStart: i,
          processedCount: results.reduce((sum, r) => sum + r.length, 0),
          totalProcessed: allValuesWithEmbeddings.length,
        });
      }

      // Step 8: Upsert to Turbopuffer in batches with concurrency
      logger.info('Upserting values to Turbopuffer', {
        [identifierType]: identifier,
        count: allValuesWithEmbeddings.length,
      });

      // Process upserts in batches with concurrency to improve performance
      const UPSERT_BATCH_SIZE = 500; // Upsert 500 values at a time
      const UPSERT_CONCURRENCY = 3; // Process up to 3 upserts concurrently (lower than embeddings to avoid overwhelming Turbopuffer)
      let totalUpserted = 0;
      const upsertErrors: string[] = [];

      // Create upsert batches
      const upsertBatches: SearchableValue[][] = [];
      for (let i = 0; i < allValuesWithEmbeddings.length; i += UPSERT_BATCH_SIZE) {
        upsertBatches.push(allValuesWithEmbeddings.slice(i, i + UPSERT_BATCH_SIZE));
      }

      logger.info('Processing upserts with concurrency', {
        [identifierType]: identifier,
        totalBatches: upsertBatches.length,
        batchSize: UPSERT_BATCH_SIZE,
        concurrency: UPSERT_CONCURRENCY,
        totalValues: allValuesWithEmbeddings.length,
      });

      // Process batches with controlled concurrency
      for (let i = 0; i < upsertBatches.length; i += UPSERT_CONCURRENCY) {
        const concurrentBatches = upsertBatches.slice(i, i + UPSERT_CONCURRENCY);

        logger.info('Processing concurrent upsert batch group', {
          [identifierType]: identifier,
          groupStart: i,
          groupSize: concurrentBatches.length,
          totalGroups: Math.ceil(upsertBatches.length / UPSERT_CONCURRENCY),
        });

        // Process multiple upsert batches concurrently
        const upsertPromises = concurrentBatches.map(async (batch, batchIndex) => {
          const absoluteBatchIndex = i + batchIndex;

          logger.info('Starting upsert batch', {
            [identifierType]: identifier,
            batchIndex: absoluteBatchIndex,
            batchSize: batch.length,
            totalBatches: upsertBatches.length,
          });

          try {
            const batchResult = await upsertSearchableValues({
              dataSourceId: payload.dataSourceId,
              values: batch,
            });

            if (batchResult.errors && batchResult.errors.length > 0) {
              // Collect errors but don't throw immediately
              logger.error('Upsert batch had errors', {
                [identifierType]: identifier,
                batchIndex: absoluteBatchIndex,
                errorsInBatch: batchResult.errors.length,
                errors: batchResult.errors,
              });

              upsertErrors.push(...batchResult.errors);
            }

            logger.info('Completed upsert batch', {
              [identifierType]: identifier,
              batchIndex: absoluteBatchIndex,
              upserted: batchResult.upserted,
            });

            return batchResult.upserted;
          } catch (error) {
            logger.error('Failed to process upsert batch', {
              [identifierType]: identifier,
              batchIndex: absoluteBatchIndex,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        });

        // Wait for all concurrent upserts to complete
        const results = await Promise.all(upsertPromises);
        totalUpserted += results.reduce((sum, count) => sum + count, 0);

        logger.info('Completed concurrent upsert batch group', {
          [identifierType]: identifier,
          groupStart: i,
          totalUpserted: totalUpserted,
        });
      }

      // Check if there were any errors
      if (upsertErrors.length > 0) {
        throw new Error(
          `Failed to upsert ${upsertErrors.length} values to Turbopuffer: ${upsertErrors.slice(0, 3).join(', ')}${upsertErrors.length > 3 ? '...' : ''}`
        );
      }

      logger.info('All upserts completed successfully', {
        [identifierType]: identifier,
        totalUpserted: totalUpserted,
      });

      // Step 9: Update parquet cache with all values (existing + new)
      logger.info('Updating parquet cache', {
        [identifierType]: identifier,
        totalValues: distinctValues.length,
      });

      const cacheUpdated = await updateCache(
        payload.dataSourceId,
        payload.databaseName,
        payload.schemaName,
        payload.tableName,
        payload.columnName,
        distinctValues, // All distinct values from the source
        storageProvider
      );

      if (!cacheUpdated) {
        logger.warn('Failed to update parquet cache, but sync completed', {
          [identifierType]: identifier,
        });
      }

      // Step 9: Calculate final metrics
      const metadata = {
        processedCount: distinctValues.length,
        existingCount: cacheResult.existingValues.length,
        newCount: cacheResult.newValues.length,
        duration: Date.now() - startTime,
      };

      // Future: Could track sync status in datasets table if needed

      logger.info('Sync job completed successfully', {
        [identifierType]: identifier,
        datasetName: payload.datasetName,
        processedCount: metadata.processedCount,
        newCount: metadata.newCount,
        duration: metadata.duration,
      });

      return {
        datasetId: payload.datasetId,
        success: true,
        processedCount: metadata.processedCount,
        existingCount: metadata.existingCount,
        newCount: metadata.newCount,
        duration: metadata.duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Sync job failed', {
        [identifierType]: identifier,
        datasetName: payload.datasetName,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Log the failure (no longer updating job status)

      // Future: Could track sync failures in datasets table if needed

      return {
        datasetId: payload.datasetId,
        success: false,
        error: errorMessage,
      };
    } finally {
      // Clean up database connection
      if (adapter) {
        try {
          await adapter.close();
          logger.info('Database connection closed', { [identifierType]: identifier });
        } catch (disconnectError) {
          logger.error('Failed to disconnect database adapter', {
            [identifierType]: identifier,
            error: disconnectError instanceof Error ? disconnectError.message : 'Unknown error',
          });
        }
      }
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Query distinct values from a specific column in the data source
 * Handles different database types and returns unique text values
 */
async function queryDistinctColumnValues({
  adapter,
  databaseName,
  schemaName,
  tableName,
  columnName,
  limit,
}: {
  adapter: DatabaseAdapter;
  databaseName: string;
  schemaName: string;
  tableName: string;
  columnName: string;
  limit?: number; // Optional - when not provided, query all distinct values
}): Promise<string[]> {
  // Get the data source type to determine proper identifier quoting
  const dataSourceType = adapter.getDataSourceType();

  // Determine the appropriate quote character based on data source type
  let quoteChar = '';
  switch (dataSourceType) {
    case 'postgres':
    case 'redshift':
      quoteChar = '"';
      break;
    case 'mysql':
    case 'bigquery':
      quoteChar = '`';
      break;
    case 'sqlserver':
      // SQL Server uses square brackets, but we'll handle it differently
      break;
    case 'snowflake':
      // Snowflake doesn't need quotes unless identifiers have special chars or are case-sensitive
      // For safety, we'll omit quotes for Snowflake
      break;
    default:
      // Default to no quotes
      break;
  }

  // Build the fully qualified table name
  const fullyQualifiedTable = `${databaseName}.${schemaName}.${tableName}`;

  // Build the column reference with appropriate quoting
  let columnRef = columnName;
  if (dataSourceType === 'sqlserver') {
    columnRef = `[${columnName}]`;
  } else if (quoteChar) {
    columnRef = `${quoteChar}${columnName}${quoteChar}`;
  }

  // Build the query to get distinct non-null values
  // Removed ORDER BY since we're joining with cached datasets
  const query = `
    SELECT DISTINCT ${columnRef} AS value
    FROM ${fullyQualifiedTable}
    WHERE ${columnRef} IS NOT NULL
      AND TRIM(${columnRef}) != ''${
        limit
          ? `
    LIMIT ${limit}`
          : ''
      }
  `;

  logger.info('Executing distinct values query', {
    table: fullyQualifiedTable,
    column: columnName,
    dataSourceType,
    limit: limit || 'no limit',
  });

  try {
    const result = await adapter.query(query);

    // Extract values from the result
    const values: string[] = [];
    for (const row of result.rows) {
      const value = row.value;
      if (
        value !== null &&
        value !== undefined &&
        typeof value === 'string' &&
        value.trim() !== ''
      ) {
        values.push(value);
      }
    }

    return values;
  } catch (error) {
    logger.error('Failed to query distinct values', {
      table: fullyQualifiedTable,
      column: columnName,
      dataSourceType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(
      `Failed to query distinct values from ${fullyQualifiedTable}.${columnName}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
