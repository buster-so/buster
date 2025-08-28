import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { createAdapter, sampleTable } from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database';
import {
  SampleTableTaskInputSchema,
  type SampleTableTaskInput,
  type SampleTableTaskOutput,
  type TableMetadata,
} from './types';

/**
 * Sub-task for sampling individual tables
 * 
 * This task:
 * 1. Fetches credentials for the data source
 * 2. Creates a database adapter connection
 * 3. Samples the specified table using dialect-specific methods
 * 4. Returns sample summary (future: perform statistical analysis)
 * 
 * @example
 * ```typescript
 * const result = await sampleTableTask.trigger({
 *   dataSourceId: 'abc-123',
 *   table: {
 *     name: 'users',
 *     schema: 'public',
 *     database: 'mydb',
 *     rowCount: 50000,
 *     type: 'TABLE'
 *   },
 *   sampleSize: 10000
 * });
 * ```
 */
export const sampleTableTask = schemaTask({
  id: 'sample-table',
  schema: SampleTableTaskInputSchema,
  maxDuration: 120, // 2 minutes per table
  run: async (payload: SampleTableTaskInput): Promise<SampleTableTaskOutput> => {
    const tableId = `${payload.table.database}.${payload.table.schema}.${payload.table.name}`;
    
    logger.log('Starting table sampling', {
      dataSourceId: payload.dataSourceId,
      tableId,
      rowCount: payload.table.rowCount,
      requestedSampleSize: payload.sampleSize,
    });

    let adapter = null;
    
    try {
      // Step 1: Fetch credentials from vault
      logger.log('Fetching credentials for data source', { dataSourceId: payload.dataSourceId });
      const credentials = await getDataSourceCredentials({ dataSourceId: payload.dataSourceId });

      // Validate credentials have required type field
      if (!credentials.type) {
        throw new Error('Invalid credentials: missing type field');
      }

      // Step 2: Create adapter
      logger.log('Creating database adapter', { type: credentials.type });
      adapter = await createAdapter(credentials as any);

      // Step 3: Convert input table to TableMetadata format
      const tableMetadata: TableMetadata = {
        name: payload.table.name,
        schema: payload.table.schema,
        database: payload.table.database,
        rowCount: payload.table.rowCount,
        sizeBytes: payload.table.sizeBytes,
        type: payload.table.type,
      };

      // Step 4: Sample the table
      logger.log('Sampling table', {
        tableId,
        sampleSize: payload.sampleSize,
      });

      const sample = await sampleTable(
        adapter,
        credentials.type as any,
        tableMetadata,
        payload.sampleSize
      );

      logger.log('Table sampling completed', {
        tableId,
        actualSamples: sample.sampleSize,
        samplingMethod: sample.samplingMethod,
      });

      // TODO: Statistical analysis phase
      // This is where we would analyze the sample data to:
      // 1. Calculate column statistics (min, max, avg, stddev, etc.)
      // 2. Detect data types and patterns
      // 3. Identify potential issues (nulls, duplicates, etc.)
      // 4. Generate data quality metrics
      // For now, we just log a placeholder
      logger.log('TODO: Statistical analysis of sample data', {
        tableId,
        sampleSize: sample.sampleSize,
        columnsCount: sample.sampleData.length > 0 && sample.sampleData[0] ? Object.keys(sample.sampleData[0]).length : 0,
      });

      return {
        success: true,
        tableId,
        sampleSize: payload.sampleSize,
        actualSamples: sample.sampleSize,
        samplingMethod: sample.samplingMethod,
      };
    } catch (error) {
      logger.error('Table sampling failed', {
        tableId,
        dataSourceId: payload.dataSourceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        tableId,
        sampleSize: payload.sampleSize,
        actualSamples: 0,
        samplingMethod: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      // Clean up adapter connection
      if (adapter) {
        try {
          await adapter.close();
          logger.log('Database adapter disconnected');
        } catch (cleanupError) {
          logger.warn('Failed to disconnect adapter', {
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        }
      }
    }
  },
});