import { getExistingSyncJobs } from '@buster/database';
import { logger, schedules } from '@trigger.dev/sdk';
import { processSyncJob } from './process-sync-job';
import type { DailySyncReport, DataSourceSyncSummary, SyncJobPayload } from './types';

/**
 * Daily scheduled task to sync searchable values from data sources
 *
 * This task runs every day at 2 AM UTC and:
 * 1. Retrieves existing sync jobs from stored_values_sync_jobs table
 * 2. Triggers sync jobs for processing (fire and forget)
 * 3. Reports on the number of jobs triggered
 *
 * The actual sync logic is handled asynchronously by process-sync-job.ts
 */
export const syncSearchableValues = schedules.task({
  id: 'sync-searchable-values',
  cron: '0 2 * * *', // Daily at 2 AM UTC
  maxDuration: 3600, // 1 hour max execution time
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload): Promise<DailySyncReport> => {
    const executionId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const dataSourceSummaries: DataSourceSyncSummary[] = [];

    logger.info('Starting daily searchable values sync', {
      executionId,
      timestamp: payload.timestamp,
      lastRun: payload.lastTimestamp,
    });

    try {
      // Step 1: Get all existing sync jobs from the stored_values_sync_jobs table
      const syncJobsResult = await getExistingSyncJobs({
        statuses: ['pending', 'success'],
      });

      logger.info('Found existing sync jobs', {
        executionId,
        totalJobs: syncJobsResult.totalCount,
        dataSourceCount: Object.keys(syncJobsResult.byDataSource).length,
      });

      if (syncJobsResult.totalCount === 0) {
        logger.info('No sync jobs found to process', { executionId });
        return createReport(executionId, startTime, [], errors);
      }

      // Step 2: Process sync jobs grouped by data source
      for (const dataSourceId in syncJobsResult.byDataSource) {
        const dataSourceInfo = syncJobsResult.byDataSource[dataSourceId];
        if (!dataSourceInfo) continue;

        const summary: DataSourceSyncSummary = {
          dataSourceId,
          dataSourceName: dataSourceInfo.dataSourceName,
          totalColumns: dataSourceInfo.jobCount,
          successfulSyncs: 0,
          failedSyncs: 0,
          skippedSyncs: 0,
          totalValuesProcessed: 0,
          errors: [],
        };

        try {
          logger.info('Processing data source', {
            executionId,
            dataSourceId,
            dataSourceName: dataSourceInfo.dataSourceName,
            jobCount: dataSourceInfo.jobCount,
          });

          // Step 3: Trigger sync jobs for this data source (fire and forget)
          const jobs = dataSourceInfo.jobs;
          let triggeredCount = 0;
          let triggerFailureCount = 0;

          for (const job of jobs) {
            try {
              // Prepare payload for processing
              const syncPayload: SyncJobPayload = {
                jobId: job.id,
                dataSourceId: job.dataSourceId,
                databaseName: job.databaseName,
                schemaName: job.schemaName,
                tableName: job.tableName,
                columnName: job.columnName,
                // No limit on values - process all distinct values
              };

              // Trigger the sync job without waiting
              await processSyncJob.trigger(syncPayload);
              triggeredCount++;

              logger.info('Sync job triggered', {
                executionId,
                jobId: job.id,
                table: job.tableName,
                column: job.columnName,
              });
            } catch (error) {
              triggerFailureCount++;
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              summary.errors.push(
                `Failed to trigger job ${job.tableName}.${job.columnName}: ${errorMsg}`
              );

              logger.error('Failed to trigger sync job', {
                executionId,
                jobId: job.id,
                table: job.tableName,
                column: job.columnName,
                error: errorMsg,
              });
            }
          }

          summary.successfulSyncs = triggeredCount;
          summary.failedSyncs = triggerFailureCount;

          dataSourceSummaries.push(summary);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          summary.errors.push(`Data source processing failed: ${errorMsg}`);
          errors.push(
            `Failed to process data source ${dataSourceInfo.dataSourceName}: ${errorMsg}`
          );
          dataSourceSummaries.push(summary);

          logger.error('Error processing data source', {
            executionId,
            dataSourceId,
            dataSourceName: dataSourceInfo.dataSourceName,
            error: errorMsg,
          });
        }
      }

      // Step 3: Generate and return report
      const report = createReport(executionId, startTime, dataSourceSummaries, errors);

      logger.info('Daily sync completed', {
        executionId,
        totalDataSources: report.totalDataSources,
        totalColumns: report.totalColumns,
        successfulSyncs: report.successfulSyncs,
        failedSyncs: report.failedSyncs,
        skippedSyncs: report.skippedSyncs,
        durationMs: report.durationMs,
      });

      return report;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Fatal error during sync execution: ${errorMsg}`);

      logger.error('Fatal error in daily sync', {
        executionId,
        error: errorMsg,
      });

      return createReport(executionId, startTime, dataSourceSummaries, errors);
    }
  },
});

/**
 * Helper function to create the daily sync report
 */
function createReport(
  executionId: string,
  startTime: string,
  dataSourceSummaries: DataSourceSyncSummary[],
  errors: string[]
): DailySyncReport {
  const endTime = new Date().toISOString();
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    executionId,
    startTime,
    endTime,
    durationMs,
    totalDataSources: dataSourceSummaries.length,
    totalColumns: dataSourceSummaries.reduce((sum, ds) => sum + ds.totalColumns, 0),
    successfulSyncs: dataSourceSummaries.reduce((sum, ds) => sum + ds.successfulSyncs, 0),
    failedSyncs: dataSourceSummaries.reduce((sum, ds) => sum + ds.failedSyncs, 0),
    skippedSyncs: dataSourceSummaries.reduce((sum, ds) => sum + ds.skippedSyncs, 0),
    totalValuesProcessed: dataSourceSummaries.reduce((sum, ds) => sum + ds.totalValuesProcessed, 0),
    dataSourceSummaries,
    errors,
  };
}
