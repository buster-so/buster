import { hasAssetPermission } from '@buster/access-controls';
import { executeMetricQuery, getCachedMetricData, setCachedMetricData } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import type { User } from '@buster/database/queries';
import {
  compileSqlWithDefaults,
  extractSqlFromMetricContent,
  getDataSourceCredentials,
  getMetricWithDataSource,
  getUserOrganizationId,
} from '@buster/database/queries';
import type { MetricDataResponse } from '@buster/server-shared/metrics';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for retrieving metric data
 *
 * This handler:
 * 1. Validates user has access to the organization
 * 2. Checks user has permission to view the metric file
 * 3. If report_file_id is provided, checks R2 cache first
 * 4. Retrieves the metric definition
 * 5. Parses the metric content to extract SQL
 * 6. Executes the query against the data source using the shared utility
 * 7. If report_file_id is provided and cache miss, writes to cache
 * 8. Returns the data with metadata and pagination info
 *
 * @param metricId - The ID of the metric to retrieve data for
 * @param user - The authenticated user
 * @param limit - Maximum number of rows to return (default 5000, max 5000)
 * @param versionNumber - Optional version number to retrieve specific metric version
 * @param reportFileId - Optional report file ID for cache lookup
 * @returns The metric data with metadata
 */
export async function getMetricDataHandler(
  metricId: string,
  user: User,
  limit = 5000,
  versionNumber?: number,
  reportFileId?: string,
  password?: string
): Promise<MetricDataResponse> {
  // Retrieve metric definition from database with data source info
  const metric = await getMetricWithDataSource({ metricId, versionNumber });

  if (!metric) {
    throw new HTTPException(404, {
      message: 'Metric not found',
    });
  }

  // Check if user has permission to view this metric file
  // hasAssetPermission internally handles:
  // 1. Direct permissions
  // 2. Admin permissions
  // 3. Workspace sharing permissions (if provided)
  // 4. Cascading permissions (dashboard, chat, collection)
  const hasAccess = await hasAssetPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId: metric.organizationId,
    workspaceSharing: metric.workspaceSharing ?? 'none',
    publiclyAccessible: metric.publiclyAccessible,
    publicExpiryDate: metric.publicExpiryDate ?? undefined,
    publicPassword: metric.publicPassword ?? undefined,
    userSuppliedPassword: password,
  });

  if (!hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  // Determine the actual version number we're working with
  const resolvedVersion = metric.versionNumber;

  // Check R2 cache if report_file_id is provided
  if (reportFileId) {
    console.info('Checking R2 cache for metric data', {
      metricId,
      reportFileId,
      organizationId: metric.organizationId,
      version: resolvedVersion,
    });

    try {
      const cachedData = await getCachedMetricData(
        metric.organizationId,
        metricId,
        reportFileId,
        resolvedVersion
      );
      if (cachedData) {
        console.info('Cache hit - returning cached metric data', {
          metricId,
          reportFileId,
          version: resolvedVersion,
          rowCount: cachedData.data?.length || 0,
        });
        return cachedData;
      }
      console.info('Cache miss - will fetch from data source', {
        metricId,
        reportFileId,
        version: resolvedVersion,
      });
    } catch (error) {
      console.error('Error checking cache, falling back to data source', {
        metricId,
        reportFileId,
        version: resolvedVersion,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Ensure limit is within bounds
  const queryLimit = Math.min(Math.max(limit, 1), 5000);

  // Compile SQL with defaults to remove filter tokens
  const compiledSql = compileSqlWithDefaults(metric.content);

  // Extract SQL query from metric content (for backwards compatibility if no filters)
  const sql = compiledSql || extractSqlFromMetricContent(metric.content);

  // Get data source credentials from vault
  let credentials: Credentials;
  try {
    const rawCredentials = await getDataSourceCredentials({
      dataSourceId: metric.dataSourceId,
    });

    // Ensure credentials have the correct type
    credentials = {
      ...rawCredentials,
      type: rawCredentials.type || metric.dataSourceType,
    } as Credentials;
  } catch (error) {
    console.error('Failed to retrieve data source credentials:', error);
    throw new HTTPException(500, {
      message: 'Failed to access data source',
    });
  }

  // Execute query using the shared utility
  try {
    // Request one extra row to detect if there are more records
    const result = await executeMetricQuery(metric.dataSourceId, sql, credentials, {
      maxRows: queryLimit + 1,
      timeout: 60000, // 60 seconds
      retryDelays: [1000, 3000, 6000], // 1s, 3s, 6s
    });

    // Trim to requested limit and check if there are more records
    const hasMore = result.data.length > queryLimit;
    const trimmedData = result.data.slice(0, queryLimit);

    const response: MetricDataResponse = {
      data: trimmedData,
      data_metadata: result.dataMetadata,
      metricId,
      has_more_records: hasMore || result.hasMoreRecords,
      ...(resolvedVersion !== undefined && { version: resolvedVersion }),
    };

    // Cache the data if report_file_id is provided (pass-through write)
    if (reportFileId) {
      console.info('Writing metric data to cache', {
        metricId,
        reportFileId,
        organizationId: metric.organizationId,
        version: resolvedVersion,
        rowCount: trimmedData.length,
      });

      // Fire and forget - don't wait for cache write
      setCachedMetricData(
        metric.organizationId,
        metricId,
        reportFileId,
        response,
        resolvedVersion
      ).catch((error) => {
        console.error('Failed to cache metric data', {
          metricId,
          reportFileId,
          version: resolvedVersion,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }

    return response;
  } catch (error) {
    console.error('Query execution failed:', error);

    if (error instanceof Error) {
      throw new HTTPException(500, {
        message: `Query execution failed: ${error.message}`,
      });
    }

    throw new HTTPException(500, {
      message: 'Query execution failed',
    });
  }
}
