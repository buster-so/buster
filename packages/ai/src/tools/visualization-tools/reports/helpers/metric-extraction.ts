import type { Credentials } from '@buster/data-source';
import { checkCacheExists, executeMetricQuery, setCachedMetricData } from '@buster/data-source';
import {
  extractSqlFromMetricContent,
  getDataSourceCredentials,
  getMetricWithDataSource,
  getUserOrganizationId,
} from '@buster/database/queries';
import type { MetricDataResponse } from '@buster/server-shared/metrics';

/**
 * Regular expression to match metric tags in report content
 * Matches: <metric metricId="uuid-here" />
 */
const METRIC_TAG_REGEX = /<metric\s+metricId\s*=\s*["']([a-f0-9-]+)["']\s*\/>/gi;

/**
 * Extract metric IDs from report content
 */
export function extractMetricIds(content: string): string[] {
  const metricIds = new Set<string>();
  const matches = content.matchAll(METRIC_TAG_REGEX);

  for (const match of matches) {
    const metricId = match[1];
    if (metricId) {
      metricIds.add(metricId);
    }
  }

  return Array.from(metricIds);
}

/**
 * Cache metric data for a report
 */
export async function cacheMetricForReport(
  metricId: string,
  reportId: string,
  organizationId: string
): Promise<void> {
  try {
    console.info('[metric-extraction] Caching metric for report', {
      metricId,
      reportId,
      organizationId,
    });

    // Check if already cached
    const exists = await checkCacheExists(organizationId, metricId, reportId);
    if (exists) {
      console.info('[metric-extraction] Metric already cached, skipping', {
        metricId,
        reportId,
      });
      return;
    }

    // Fetch metric definition
    const metric = await getMetricWithDataSource({ metricId });
    if (!metric) {
      console.warn('[metric-extraction] Metric not found', { metricId });
      return;
    }

    // Verify metric belongs to the organization
    if (metric.organizationId !== organizationId) {
      console.warn('[metric-extraction] Metric belongs to different organization', {
        metricId,
        metricOrgId: metric.organizationId,
        expectedOrgId: organizationId,
      });
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
      console.error('[metric-extraction] Failed to get credentials', {
        metricId,
        dataSourceId: metric.dataSourceId,
        error,
      });
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

    console.info('[metric-extraction] Successfully cached metric', {
      metricId,
      reportId,
      rowCount: result.data.length,
    });
  } catch (error) {
    console.error('[metric-extraction] Failed to cache metric', {
      metricId,
      reportId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - caching failures shouldn't break report creation
  }
}

/**
 * Extract and cache all metrics from report content
 */
export async function extractAndCacheMetrics(
  content: string,
  reportId: string,
  organizationId: string
): Promise<void> {
  const metricIds = extractMetricIds(content);

  if (metricIds.length === 0) {
    console.info('[metric-extraction] No metrics found in report content');
    return;
  }

  console.info('[metric-extraction] Found metrics in report', {
    reportId,
    metricCount: metricIds.length,
    metricIds,
  });

  // Cache metrics in parallel with limited concurrency
  const BATCH_SIZE = 3; // Process 3 metrics at a time to avoid overwhelming the system

  for (let i = 0; i < metricIds.length; i += BATCH_SIZE) {
    const batch = metricIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((metricId) => cacheMetricForReport(metricId, reportId, organizationId))
    );
  }

  console.info('[metric-extraction] Completed caching all metrics', {
    reportId,
    metricCount: metricIds.length,
  });
}

/**
 * Extract and cache metrics with proper user context
 */
export async function extractAndCacheMetricsWithUserContext(
  content: string,
  reportId: string,
  userId: string
): Promise<void> {
  try {
    // Get user's organization
    const userOrg = await getUserOrganizationId(userId);
    if (!userOrg) {
      console.warn('[metric-extraction] User has no organization', { userId });
      return;
    }

    await extractAndCacheMetrics(content, reportId, userOrg.organizationId);
  } catch (error) {
    console.error('[metric-extraction] Failed to extract and cache metrics', {
      reportId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - caching failures shouldn't break the main flow
  }
}
