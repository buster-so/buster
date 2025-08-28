import { logger, schemaTask, task } from '@trigger.dev/sdk/v3';
import { createAdapter } from '@buster/data-source';
import { getStructuralMetadata, getDynamicSampleSize } from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database';
import {
  IntrospectDataTaskInputSchema,
  type IntrospectDataTaskInput,
  type IntrospectDataTaskOutput,
  type SampleTableTaskInput,
} from './types';
import { sampleTableTask } from './sampleTableTask';

/**
 * Main introspection task that fetches structural metadata and triggers sampling sub-tasks
 * 
 * This task:
 * 1. Fetches credentials for the data source
 * 2. Creates a database adapter connection
 * 3. Gets structural metadata (tables and row counts)
 * 4. Triggers sub-tasks to sample each table
 * 5. Returns summary of the introspection
 * 
 * @example
 * ```typescript
 * const result = await introspectDataTask.trigger({
 *   dataSourceId: 'abc-123',
 *   filters: {
 *     databases: ['MY_DB'],
 *     schemas: ['PUBLIC']
 *   }
 * });
 * ```
 */
export const introspectDataTask = schemaTask({
  id: 'introspect-data-main',
  schema: IntrospectDataTaskInputSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload: IntrospectDataTaskInput): Promise<IntrospectDataTaskOutput> => {
    logger.log('Starting data source introspection', {
      dataSourceId: payload.dataSourceId,
      filters: payload.filters,
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

      // Step 3: Get structural metadata
      logger.log('Fetching structural metadata', { filters: payload.filters });
      const metadata = await getStructuralMetadata(
        adapter,
        credentials.type as any,
        payload.filters
      );

      // Update metadata with dataSourceId
      metadata.dataSourceId = payload.dataSourceId;

      logger.log('Structural metadata fetched', {
        tablesFound: metadata.tables.length,
        dataSourceType: metadata.dataSourceType,
      });

      // Step 4: Trigger sub-tasks for each table
      const subTaskPromises: Promise<any>[] = [];
      
      for (const table of metadata.tables) {
        // Calculate dynamic sample size
        const sampleSize = getDynamicSampleSize(table.rowCount);
        
        logger.log('Triggering sample task for table', {
          table: `${table.database}.${table.schema}.${table.name}`,
          rowCount: table.rowCount,
          sampleSize,
        });

        // Prepare sub-task input
        const subTaskInput: SampleTableTaskInput = {
          dataSourceId: payload.dataSourceId,
          table: {
            name: table.name,
            schema: table.schema,
            database: table.database,
            rowCount: table.rowCount,
            sizeBytes: table.sizeBytes,
            type: table.type,
          },
          sampleSize,
        };

        // Trigger sub-task without waiting
        const promise = sampleTableTask.trigger(subTaskInput);
        subTaskPromises.push(promise);
      }

      // Wait for all sub-tasks to be triggered (not completed)
      await Promise.all(subTaskPromises);

      logger.log('All sampling sub-tasks triggered successfully', {
        dataSourceId: payload.dataSourceId,
        subTasksCount: subTaskPromises.length,
      });

      return {
        success: true,
        dataSourceId: payload.dataSourceId,
        tablesFound: metadata.tables.length,
        subTasksTriggered: subTaskPromises.length,
      };
    } catch (error) {
      logger.error('Introspection failed', {
        dataSourceId: payload.dataSourceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        dataSourceId: payload.dataSourceId,
        tablesFound: 0,
        subTasksTriggered: 0,
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