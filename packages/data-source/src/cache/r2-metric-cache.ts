import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { MetricDataResponse } from '@buster/server-shared/metrics';

// Initialize R2 client (S3-compatible)
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not configured');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

const R2_BUCKET = process.env.R2_BUCKET || 'metric-exports';
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
    const client = getR2Client();
    const key = generateCacheKey(organizationId, metricId, reportId);

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Range: 'bytes=0-0', // Just check if object exists by requesting first byte
    });

    await client.send(command);
    return true;
  } catch (error: unknown) {
    // Object doesn't exist or other error
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
      return false;
    }
    console.error('[r2-metric-cache] Error checking cache existence:', error);
    return false;
  }
}

/**
 * Get cached metric data from R2
 */
export async function getCachedMetricData(
  organizationId: string,
  metricId: string,
  reportId: string
): Promise<MetricDataResponse | null> {
  try {
    const client = getR2Client();
    const key = generateCacheKey(organizationId, metricId, reportId);

    console.info('[r2-metric-cache] Fetching cached data', {
      organizationId,
      metricId,
      reportId,
      key,
    });

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      console.warn('[r2-metric-cache] No body in cache response');
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Convert JSON to metric data
    const data = jsonToData(buffer);
    data.metricId = metricId;

    console.info('[r2-metric-cache] Cache hit', {
      organizationId,
      metricId,
      reportId,
      rowCount: data.data?.length || 0,
    });

    return data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
      console.info('[r2-metric-cache] Cache miss', {
        organizationId,
        metricId,
        reportId,
      });
      return null;
    }

    console.error('[r2-metric-cache] Error fetching cached data:', error);
    return null;
  }
}

/**
 * Set cached metric data in R2
 */
export async function setCachedMetricData(
  organizationId: string,
  metricId: string,
  reportId: string,
  data: MetricDataResponse
): Promise<void> {
  try {
    const client = getR2Client();
    const key = generateCacheKey(organizationId, metricId, reportId);

    console.info('[r2-metric-cache] Caching metric data', {
      organizationId,
      metricId,
      reportId,
      key,
      rowCount: data.data?.length || 0,
    });

    // Convert data to JSON format
    const jsonBuffer = dataToJson(data);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: jsonBuffer,
      ContentType: 'application/json',
      Metadata: {
        'organization-id': organizationId,
        'metric-id': metricId,
        'report-id': reportId,
        'row-count': String(data.data?.length || 0),
        'cached-at': new Date().toISOString(),
      },
    });

    await client.send(command);

    console.info('[r2-metric-cache] Successfully cached metric data', {
      organizationId,
      metricId,
      reportId,
      sizeBytes: jsonBuffer.length,
    });
  } catch (error) {
    console.error('[r2-metric-cache] Error caching metric data:', error);
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
