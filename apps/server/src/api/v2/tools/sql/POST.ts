import { createPermissionErrorMessage, validateSqlPermissions } from '@buster/access-controls';
import type { Credentials } from '@buster/data-source';
import { executeMetricQuery } from '@buster/data-source';
import {
  getDataSourceById,
  getDataSourceCredentials,
  getUserOrganizationId,
} from '@buster/database/queries';
import type { ApiKeyContext, RunSqlRequest, RunSqlResponse } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for running SQL queries against data sources via API key authentication
 *
 * This handler:
 * 1. Validates API key has access to the organization
 * 2. Verifies data source belongs to API key's organization
 * 3. For workspace_admin or data_admin roles, skips permission validation (allows all queries)
 * 4. For other roles, validates SQL permissions against user's permissioned datasets
 * 5. Executes the query with retry logic and timeout handling
 * 6. Returns the data with metadata and pagination info
 *
 * @param request - The SQL query request containing data_source_id and sql
 * @param apiKeyContext - The authenticated API key context
 * @returns The query results with metadata
 */
export async function runSqlHandler(
  request: RunSqlRequest,
  apiKeyContext: ApiKeyContext
): Promise<RunSqlResponse> {
  const { organizationId, ownerId } = apiKeyContext;

  // Get data source details
  const dataSource = await getDataSourceById(request.data_source_id);

  if (!dataSource) {
    throw new HTTPException(404, {
      message: 'Data source not found',
    });
  }

  // Verify data source belongs to API key's organization
  if (dataSource.organizationId !== organizationId) {
    throw new HTTPException(403, {
      message: 'You do not have permission to access this data source',
    });
  }

  // Get user's role in the organization
  const userOrg = await getUserOrganizationId(ownerId);
  const userRole = userOrg?.role;

  // Check if user is workspace_admin or data_admin - these roles have unrestricted access
  const isAdminRole = userRole === 'workspace_admin' || userRole === 'data_admin';

  // Only validate permissions for non-admin roles
  if (!isAdminRole) {
    const permissionResult = await validateSqlPermissions(request.sql, ownerId, dataSource.type);

    if (!permissionResult.isAuthorized) {
      const errorMessage =
        permissionResult.error ||
        createPermissionErrorMessage(
          permissionResult.unauthorizedTables,
          permissionResult.unauthorizedColumns
        );

      throw new HTTPException(403, {
        message: errorMessage,
      });
    }
  }

  // Get data source credentials from vault
  let credentials: Credentials;
  try {
    const rawCredentials = await getDataSourceCredentials({
      dataSourceId: request.data_source_id,
    });

    // Validate credential type matches data source type
    if (rawCredentials.type && rawCredentials.type !== dataSource.type) {
      console.warn(
        `Credential type mismatch: credentials have type '${rawCredentials.type}' but data source has type '${dataSource.type}'. Using data source type.`
      );
    }

    // Use data source type as the source of truth
    credentials = {
      ...rawCredentials,
      type: dataSource.type,
    } as Credentials;
  } catch (error) {
    console.error('Failed to retrieve data source credentials:', error);
    throw new HTTPException(500, {
      message: 'Failed to access data source',
    });
  }

  // Execute query using the shared utility with 5000 row limit
  try {
    // Request one extra row to detect if there are more records
    const result = await executeMetricQuery(request.data_source_id, request.sql, credentials, {
      maxRows: 5001,
      timeout: 60000, // 60 seconds
      retryDelays: [1000, 3000, 6000], // 1s, 3s, 6s
    });

    // Trim to 5000 rows and check if there are more records
    const hasMore = result.data.length > 5000;
    const trimmedData = result.data.slice(0, 5000);

    // Use the data source's hasMoreRecords if available, otherwise use our local check
    // This ensures we have a single source of truth for pagination state
    const hasMoreRecords = result.hasMoreRecords !== undefined ? result.hasMoreRecords : hasMore;

    const response: RunSqlResponse = {
      data: trimmedData,
      data_metadata: result.dataMetadata,
      has_more_records: hasMoreRecords,
    };

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
