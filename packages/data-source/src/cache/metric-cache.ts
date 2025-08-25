import type { MetricDataResponse } from '@buster/server-shared/metrics';
import { getProviderForOrganization } from '../storage';

const CACHE_PREFIX = 'static-report-assets';

/**
 * Generate cache key for metric data
 */
export function generateCacheKey(
  organizationId: string,
  metricId: string,
  reportId: string
): string {
  return `${CACHE_PREFIX}/${organizationId}/${metricId}-${reportId}.json`;
}

/**
 * Convert metric data to JSON format for storage
 */
function dataToJson(data: MetricDataResponse): Buffer {
  // Simply serialize the entire MetricDataResponse to JSON
  // This preserves all metadata and data exactly as is
  return Buffer.from(JSON.stringify(data));
}

/**
 * Convert JSON buffer back to metric data format
 */
function jsonToData(buffer: Buffer): MetricDataResponse {
  // Parse the JSON back to MetricDataResponse
  return JSON.parse(buffer.toString()) as MetricDataResponse;
}

/**
 * Check if cached metric data exists
 */
export async function checkCacheExists(
  organizationId: string,
  metricId: string,
  reportId: string
): Promise<boolean> {
  try {
    const storageProvider = await getProviderForOrganization(organizationId);
    const key = generateCacheKey(organizationId, metricId, reportId);

    const exists = await storageProvider.exists(key);
    return exists;
  } catch (error: unknown) {
    console.error('[metric-cache] Error checking cache existence:', error);
    return false;
  }
}

/**
 * Get cached metric data from storage
 */
export async function getCachedMetricData(
  organizationId: string,
  metricId: string,
  reportId: string
): Promise<MetricDataResponse | null> {
  try {
    const storageProvider = await getProviderForOrganization(organizationId);
    const key = generateCacheKey(organizationId, metricId, reportId);

    console.info('[metric-cache] Fetching cached data', {
      organizationId,
      metricId,
      reportId,
      key,
    });

    const downloadResult = await storageProvider.download(key);

    if (!downloadResult.success || !downloadResult.data) {
      console.info('[metric-cache] Cache miss', {
        organizationId,
        metricId,
        reportId,
      });
      return null;
    }

    // Convert JSON to metric data
    const data = jsonToData(downloadResult.data);
    data.metricId = metricId;

    console.info('[metric-cache] Cache hit', {
      organizationId,
      metricId,
      reportId,
      rowCount: data.data?.length || 0,
    });

    return data;
  } catch (error: unknown) {
    console.error('[metric-cache] Error fetching cached data:', error);
    return null;
  }
}

/**
 * Set cached metric data in storage
 */
export async function setCachedMetricData(
  organizationId: string,
  metricId: string,
  reportId: string,
  data: MetricDataResponse
): Promise<void> {
  try {
    const storageProvider = await getProviderForOrganization(organizationId);
    const key = generateCacheKey(organizationId, metricId, reportId);

    console.info('[metric-cache] Caching metric data', {
      organizationId,
      metricId,
      reportId,
      key,
      rowCount: data.data?.length || 0,
    });

    // Convert data to JSON format
    const jsonBuffer = dataToJson(data);

    const uploadResult = await storageProvider.upload(key, jsonBuffer, {
      contentType: 'application/json',
      metadata: {
        'organization-id': organizationId,
        'metric-id': metricId,
        'report-id': reportId,
        'row-count': String(data.data?.length || 0),
        'cached-at': new Date().toISOString(),
      },
    });

    if (uploadResult.success) {
      console.info('[metric-cache] Successfully cached metric data', {
        organizationId,
        metricId,
        reportId,
        sizeBytes: jsonBuffer.length,
      });
    } else {
      console.error('[metric-cache] Failed to cache metric data:', uploadResult.error);
    }
  } catch (error) {
    console.error('[metric-cache] Error caching metric data:', error);
    // Don't throw - caching failures shouldn't break the main flow
  }
}

/**
 * Batch check if multiple metrics are cached
 */
export async function batchCheckCacheExists(
  organizationId: string,
  metricReportPairs: Array<{ metricId: string; reportId: string }>
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Check in parallel but limit concurrency
  const BATCH_SIZE = 10;
  for (let i = 0; i < metricReportPairs.length; i += BATCH_SIZE) {
    const batch = metricReportPairs.slice(i, i + BATCH_SIZE);
    const checks = await Promise.all(
      batch.map(async ({ metricId, reportId }) => {
        const exists = await checkCacheExists(organizationId, metricId, reportId);
        return { key: `${metricId}-${reportId}`, exists };
      })
    );

    for (const { key, exists } of checks) {
      results.set(key, exists);
    }
  }

  return results;
}
