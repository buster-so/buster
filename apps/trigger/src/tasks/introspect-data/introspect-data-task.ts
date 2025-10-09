import { createAdapter } from '@buster/data-source';
import { DataSourceType, getDynamicSampleSize, getStructuralMetadata } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import {
  getDataSourceCredentials,
  getDataSourceWithDetails,
  upsertDataset,
} from '@buster/database/queries';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { getTableStatisticsTask } from './get-table-statistics-task';
import {
  type GetTableStatisticsInput,
  type IntrospectDataTaskInput,
  IntrospectDataTaskInputSchema,
  type IntrospectDataTaskOutput,
} from './types';
import { calculateSizingInfo, formatBytes } from './utils/machine-sizing';

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
  machine: 'small-2x',
  maxDuration: 600, // 10 minutes
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

      // Filter out excluded tables if specified
      let filteredTables = metadata.tables;
      if (payload.filters?.excludeTables && payload.filters.excludeTables.length > 0) {
        const excludeSet = new Set(
          payload.filters.excludeTables.map((t: string) => t.toLowerCase())
        );
        filteredTables = metadata.tables.filter((table) => {
          const tableName = table.name.toLowerCase();
          const fullTableName = `${table.database}.${table.schema}.${table.name}`.toLowerCase();
          return !excludeSet.has(tableName) && !excludeSet.has(fullTableName);
        });

        logger.log('Tables filtered', {
          originalCount: metadata.tables.length,
          filteredCount: filteredTables.length,
          excludedCount: metadata.tables.length - filteredTables.length,
        });
      }

      // Step 4: Get data source details for dataset creation
      logger.log('Fetching data source details for dataset creation');
      const dataSourceDetails = await getDataSourceWithDetails({
        dataSourceId: payload.dataSourceId,
      });

      // Step 5: Create dataset records for each table
      logger.log('Creating dataset records', {
        tableCount: filteredTables.length,
      });

      for (const table of filteredTables) {
        await upsertDataset({
          name: table.name,
          dataSourceId: payload.dataSourceId, // Use dataSourceId as the name
          database: table.database,
          schema: table.schema,
          sql_definition: `SELECT * FROM ${table.database}.${table.schema}.${table.name}`,
          yml_file: '', // Will be populated later during introspection
          userId: dataSourceDetails.createdBy,
          organizationId: dataSourceDetails.organizationId,
        });

        logger.log('Dataset record created/updated', {
          table: `${table.database}.${table.schema}.${table.name}`,
        });
      }

      // Step 6: Trigger sub-tasks for each table
      const subTaskPromises: Promise<unknown>[] = [];

      for (const table of filteredTables) {
        // Calculate dynamic sample size
        // For views, use 1M samples for better statistical analysis
        const isView = table.type === 'VIEW' || table.type === 'MATERIALIZED_VIEW';
        const sampleSize = isView ? 1_000_000 : getDynamicSampleSize(table.rowCount);

        // Calculate optimal machine size based on table statistics
        const sizingInfo = calculateSizingInfo(table.rowCount, table.sizeBytes, sampleSize);

        logger.log('Triggering sample task for table', {
          table: `${table.database}.${table.schema}.${table.name}`,
          rowCount: table.rowCount,
          sizeBytes: table.sizeBytes ? formatBytes(table.sizeBytes) : 'Unknown',
          sampleSize,
          avgRowSize: sizingInfo.avgRowSizeBytes
            ? formatBytes(sizingInfo.avgRowSizeBytes)
            : 'Unknown',
          estimatedSampleSize: formatBytes(sizingInfo.estimatedSampleBytes),
          estimatedMemoryRequired: formatBytes(sizingInfo.estimatedMemoryRequired),
          selectedMachine: sizingInfo.machinePreset,
          machineSpecs: sizingInfo.machineSpecs,
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

        // Trigger sub-task with dynamic machine provisioning
        const promise = getTableStatisticsTask.trigger(subTaskInput, {
          machine: sizingInfo.machinePreset,
        });
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
        tablesFound: filteredTables.length,
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
