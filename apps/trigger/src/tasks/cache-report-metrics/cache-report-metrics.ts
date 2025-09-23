import { checkCacheExists, executeMetricQuery, setCachedMetricData } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import {
  extractSqlFromMetricContent,
  getDataSourceCredentials,
  getMetricWithDataSource,
} from '@buster/database/queries';
import type { MetricDataResponse } from '@buster/server-shared/metrics';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { CacheReportMetricsInputSchema, type CacheReportMetricsOutput } from './interfaces';

/**
 * Task for batch caching metric data for reports
 *
 * This task:
 * 1. Receives a list of metric IDs associated with a report
 * 2. For each metric, checks if it's already cached
 * 3. If not cached, fetches the data from the warehouse
 * 4. Caches the data in R2 for future use
 * 5. Returns a summary of cached metrics
 */
export const cacheReportMetrics: ReturnType<
  typeof schemaTask<
    'cache-report-metrics',
    typeof CacheReportMetricsInputSchema,
    CacheReportMetricsOutput
  >
> = schemaTask({
  id: 'cache-report-metrics',
  schema: CacheReportMetricsInputSchema,
  maxDuration: 600, // 10 minutes max
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload): Promise<CacheReportMetricsOutput> => {
    const startTime = Date.now();
    const { reportId, metricIds, organizationId } = payload;

    logger.log('Starting batch metric caching', {
      reportId,
      metricCount: metricIds.length,
      organizationId,
    });

    const cached: CacheReportMetricsOutput['cached'] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process metrics in batches to avoid overwhelming the system
    const BATCH_SIZE = 3;

    for (let i = 0; i < metricIds.length; i += BATCH_SIZE) {
      const batch = metricIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (metricId) => {
          try {
            // Check if already cached
            const exists = await checkCacheExists(organizationId, metricId, reportId);
            if (exists) {
              logger.info('Metric already cached, skipping', { metricId, reportId });
              cached.push({
                metricId,
                success: true,
                rowCount: 0, // Already cached, don't know the count
              });
              successCount++;
              return;
            }

            // Fetch metric definition
            const metric = await getMetricWithDataSource({ metricId });
            if (!metric) {
              logger.warn('Metric not found', { metricId });
              cached.push({
                metricId,
                success: false,
                error: 'Metric not found',
              });
              failureCount++;
              return;
            }

            // Verify metric belongs to the organization
            if (metric.organizationId !== organizationId) {
              logger.warn('Metric belongs to different organization', {
                metricId,
                metricOrgId: metric.organizationId,
                expectedOrgId: organizationId,
              });
              cached.push({
                metricId,
                success: false,
                error: 'Organization mismatch',
              });
              failureCount++;
              return;
            }

            // Extract SQL from metric
            const sql = extractSqlFromMetricContent(metric.content);

            // Get data source credentials
            let credentials: Credentials;
            try {
              const rawCredentials = await getDataSourceCredentials({
                dataSourceId: metric.dataSourceId,
              });

              credentials = {
                ...rawCredentials,
                type: rawCredentials.type || metric.dataSourceType,
              } as Credentials;
            } catch (error) {
              logger.error('Failed to get credentials', {
                metricId,
                dataSourceId: metric.dataSourceId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              cached.push({
                metricId,
                success: false,
                error: 'Failed to get data source credentials',
              });
              failureCount++;
              return;
            }

            // Execute query to get data
            const result = await executeMetricQuery(metric.dataSourceId, sql, credentials, {
              maxRows: 50000, // Reasonable limit for cached data
              timeout: 60000,
              retryDelays: [1000, 3000],
            });

            // Cache the data
            const metricData: MetricDataResponse = {
              data: result.data,
              data_metadata: result.dataMetadata,
              metricId,
              has_more_records: result.hasMoreRecords,
            };

            await setCachedMetricData(organizationId, metricId, reportId, metricData);

            logger.info('Successfully cached metric', {
              metricId,
              reportId,
              rowCount: result.data.length,
            });

            cached.push({
              metricId,
              success: true,
              rowCount: result.data.length,
            });
            successCount++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to cache metric', {
              metricId,
              reportId,
              error: errorMessage,
            });

            cached.push({
              metricId,
              success: false,
              error: errorMessage,
            });
            failureCount++;
          }
        })
      );
    }

    const executionTimeMs = Date.now() - startTime;

    logger.log('Batch metric caching completed', {
      reportId,
      totalMetrics: metricIds.length,
      successCount,
      failureCount,
      executionTimeMs,
    });

    return {
      success: failureCount === 0,
      reportId,
      cached,
      totalMetrics: metricIds.length,
      successCount,
      failureCount,
      executionTimeMs,
    };
  },
});
