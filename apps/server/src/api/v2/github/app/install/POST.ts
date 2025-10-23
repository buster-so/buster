import { randomBytes } from 'node:crypto';
import { getUserOrganizationId } from '@buster/database/queries';
import type { AppInstallResponse } from '@buster/server-shared/github';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../../../middleware/auth';
import { storeInstallationState } from '../../services/installation-state';

const app = new Hono().post('/', requireAuth, async (c) => {
  const user = c.get('busterUser');
  console.info('Github app/install received');
  const response: AppInstallResponse = await appInstallHandler(user.id);
  return c.json(response);
});

export default app;

export async function appInstallHandler(userId: string): Promise<AppInstallResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg) {
    throw new HTTPException(400, {
      message: 'User is not associated with an organization',
    });
  }

  // Get GitHub App ID from environment
  const appId = process.env.GH_APP_ID;
  if (!appId) {
    throw new HTTPException(500, {
      message: 'GitHub App not configured',
    });
  }

  // Build the GitHub installation URL
  const appName = process.env.GH_APP_NAME;
  if (!appName) {
    throw new HTTPException(500, {
      message: 'GitHub App name not configured',
    });
  }

  // Generate a secure state parameter
  const state = randomBytes(32).toString('hex');

  // Store the state with user/org context (expires in 10 minutes)
  await storeInstallationState(state, {
    userId: userId,
    organizationId: userOrg.organizationId,
    createdAt: new Date().toISOString(),
  });

  // GitHub will redirect to the Setup URL or Callback URL configured in the app settings
  // We pass the state as a parameter that GitHub will preserve
  const redirectUrl = `https://github.com/apps/${appName}/installations/new?state=${state}`;

  console.info(`Initiating GitHub installation for user ${userId}, org ${userOrg.organizationId}`);

  return { redirectUrl };
}
