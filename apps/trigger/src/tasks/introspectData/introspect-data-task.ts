import { createAdapter } from '@buster/data-source';
import { DataSourceType, getDynamicSampleSize, getStructuralMetadata } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { getTableStatisticsTask } from './get-table-statistics-task';
import {
  type GetTableStatisticsInput,
  type IntrospectDataTaskInput,
  IntrospectDataTaskInputSchema,
  type IntrospectDataTaskOutput,
} from './types';

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
export const introspectDataTask: ReturnType<
  typeof schemaTask<
    'introspect-data-source',
    typeof IntrospectDataTaskInputSchema,
    IntrospectDataTaskOutput
  >
> = schemaTask({
  id: 'introspect-data-source',
  schema: IntrospectDataTaskInputSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload: IntrospectDataTaskInput): Promise<IntrospectDataTaskOutput> => {
    logger.log('Starting data source introspection', {
      dataSourceId: payload.dataSourceId,
      filters: payload.filters,
    });

    let adapter = null;

    function isCredentials(value: unknown): value is Credentials {
      if (!value || typeof value !== 'object') return false;
      const type = (value as { type?: unknown }).type;
      if (typeof type !== 'string') return false;
      return (Object.values(DataSourceType) as string[]).includes(type);
    }

    try {
      // Step 1: Fetch credentials from vault
      logger.log('Fetching credentials for data source', { dataSourceId: payload.dataSourceId });
      const credentials = await getDataSourceCredentials({ dataSourceId: payload.dataSourceId });

      if (!isCredentials(credentials)) {
        throw new Error('Invalid credentials returned from vault');
      }

      // Step 2: Create adapter
      logger.log('Creating database adapter', { type: credentials.type });
      adapter = await createAdapter(credentials);

      // Step 3: Get structural metadata
      logger.log('Fetching structural metadata', { filters: payload.filters });
      const metadata = await getStructuralMetadata(adapter, credentials.type, payload.filters);

      // Update metadata with dataSourceId
      metadata.dataSourceId = payload.dataSourceId;

      logger.log('Structural metadata fetched', {
        tablesFound: metadata.tables.length,
        dataSourceType: metadata.dataSourceType,
      });

      // Step 4: Trigger sub-tasks for each table
      const subTaskPromises: Promise<unknown>[] = [];

      for (const table of metadata.tables) {
        // Calculate dynamic sample size
        const sampleSize = getDynamicSampleSize(table.rowCount);

        logger.log('Triggering sample task for table', {
          table: `${table.database}.${table.schema}.${table.name}`,
          rowCount: table.rowCount,
          sampleSize,
        });

        // Prepare sub-task input
        const subTaskInput: GetTableStatisticsInput = {
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
        const promise = getTableStatisticsTask.trigger(subTaskInput);
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
