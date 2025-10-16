import {
  getActiveGithubIntegration,
  getUserOrganizationId,
  softDeleteGithubIntegration,
  type User,
} from '@buster/database/queries';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../../../middleware/auth';

const app = new Hono().delete('/', requireAuth, async (c) => {
  const user = c.get('busterUser');
  await deleteGithubIntegrationHandler(user);
  return c.json({ success: true, message: 'GitHub integration removed successfully' });
});

export default app;

/**
 * Delete (soft delete) the GitHub integration for the user's organization
 * This removes the connection between Buster and GitHub
 */
export async function deleteGithubIntegrationHandler(user: User): Promise<void> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    throw new HTTPException(400, {
      message: 'User is not associated with an organization',
    });
  }

  // Get the active GitHub integration
  const integration = await getActiveGithubIntegration(userOrg.organizationId);

  if (!integration) {
    throw new HTTPException(404, {
      message: 'No active GitHub integration found',
    });
  }

  // Soft delete the integration
  const deleted = await softDeleteGithubIntegration(integration.id);

  if (!deleted) {
    throw new HTTPException(500, {
      message: 'Failed to delete GitHub integration',
    });
  }

  console.info(
    `GitHub integration deleted for org ${userOrg.organizationId}, installation ${integration.installationId}`
  );
}
