import { type User, db, getUserOrganizationsByUserId } from '@buster/database';
import type { DeployRequest, DeployResponse } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';
import { canUserDeployDatasets, getPermissionError } from './check-permissions';
import { deployModels } from './deploy-models';

/**
 * Handler for deploying datasets
 * Checks permissions and orchestrates batch deployment with transaction support
 */
export async function deployDatasetsHandler(
  request: DeployRequest,
  user: User
): Promise<DeployResponse> {
  // Get user organization info
  const userOrgs = await getUserOrganizationsByUserId(user.id);
  if (!userOrgs || userOrgs.length === 0) {
    throw new HTTPException(403, {
      message: 'User has no organization',
    });
  }

  // Use the first organization (most users only have one)
  const userOrg = userOrgs[0];
  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User has no organization',
    });
  }

  // Check permissions
  if (!canUserDeployDatasets(userOrg.role)) {
    throw new HTTPException(403, {
      message: getPermissionError(),
    });
  }

  // Deploy models using batch transaction
  return deployModels(request, user.id, userOrg.organizationId, db);
}
