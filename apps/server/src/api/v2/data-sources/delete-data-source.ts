import type { User } from '@buster/database/queries';
import {
  getDataSourceWithDatasets,
  getUserOrganizationId,
  softDeleteDataSource,
} from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for soft-deleting a data source
 *
 * Flow:
 * 1. Get user's organization and verify membership
 * 2. Check user has required permissions
 * 3. Verify data source exists and belongs to organization
 * 4. Soft delete the data source
 */
export async function deleteDataSourceHandler(user: User, dataSourceId: string): Promise<void> {
  // Step 1: Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to delete data sources',
    });
  }

  // Step 2: Check permissions
  const allowedRoles = ['workspace_admin', 'data_admin'];
  if (!allowedRoles.includes(userOrg.role.toLowerCase())) {
    throw new HTTPException(403, {
      message: 'Insufficient permissions. DataAdmin or WorkspaceAdmin role required',
    });
  }

  // Step 3: Verify data source exists and belongs to organization
  const existingDataSource = await getDataSourceWithDatasets({
    id: dataSourceId,
    organizationId: userOrg.organizationId,
  });

  if (!existingDataSource) {
    throw new HTTPException(404, {
      message: 'Data source not found',
    });
  }

  // Step 4: Soft delete the data source
  try {
    await softDeleteDataSource({ id: dataSourceId });
  } catch (error) {
    console.error('[deleteDataSource] Failed to delete data source', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      dataSourceId,
    });
    throw new HTTPException(500, {
      message: 'Failed to delete data source',
    });
  }
}
