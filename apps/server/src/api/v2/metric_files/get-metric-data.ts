import { type AssetPermissionCheck, checkPermission } from '@buster/access-controls';
import { executeMetricQuery, getCachedMetricData, setCachedMetricData } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import type { User } from '@buster/database';
import {
  extractSqlFromMetricContent,
  getDataSourceCredentials,
  getMetricWithDataSource,
  getUserOrganizationId,
} from '@buster/database';
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
  reportFileId?: string
): Promise<MetricDataResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to access metric data',
    });
  }

  const { organizationId } = userOrg;

  // Check if user has permission to view this metric file
  const permissionCheck: AssetPermissionCheck = {
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId,
  };

  const permissionResult = await checkPermission(permissionCheck);

  if (!permissionResult.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  // Check R2 cache if report_file_id is provided
  if (reportFileId) {
    console.info('Checking R2 cache for metric data', {
      metricId,
      reportFileId,
      organizationId,
    });

    try {
      const cachedData = await getCachedMetricData(organizationId, metricId, reportFileId);
      if (cachedData) {
        console.info('Cache hit - returning cached metric data', {
          metricId,
          reportFileId,
          rowCount: cachedData.data?.length || 0,
        });
        return cachedData;
      }
      console.info('Cache miss - will fetch from data source', {
        metricId,
        reportFileId,
      });
    } catch (error) {
      console.error('Error checking cache, falling back to data source', {
        metricId,
        reportFileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Ensure limit is within bounds
  const queryLimit = Math.min(Math.max(limit, 1), 5000);

  // Retrieve metric definition from database with data source info
  const metric = await getMetricWithDataSource({ metricId, versionNumber });

  if (!metric) {
    throw new HTTPException(404, {
      message: 'Metric not found',
    });
  }

  // Verify metric belongs to user's organization
  if (metric.organizationId !== organizationId) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this metric',
    });
  }

  // Extract SQL query from metric content
  const sql = extractSqlFromMetricContent(metric.content);

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
    const result = await executeMetricQuery(metric.dataSourceId, sql, credentials, {
      maxRows: queryLimit,
      timeout: 60000, // 60 seconds
      retryDelays: [1000, 3000, 6000], // 1s, 3s, 6s
    });

    const response: MetricDataResponse = {
      data: result.data,
      data_metadata: result.dataMetadata,
      metricId,
      has_more_records: result.hasMoreRecords,
    };

    // Cache the data if report_file_id is provided (pass-through write)
    if (reportFileId) {
      console.info('Writing metric data to cache', {
        metricId,
        reportFileId,
        organizationId,
        rowCount: result.data.length,
      });

      // Fire and forget - don't wait for cache write
      setCachedMetricData(organizationId, metricId, reportFileId, response).catch((error) => {
        console.error('Failed to cache metric data', {
          metricId,
          reportFileId,
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
