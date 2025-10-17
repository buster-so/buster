import { getActiveGithubIntegration, type User } from '@buster/database/queries';
import type { GetGitHubIntegrationResponse } from '@buster/server-shared/github';
import type { UserOrganizationRole } from '@buster/server-shared/organization';
import { Hono } from 'hono';
import { requireAuth, requireOrganization } from '../../../../middleware/auth';

const app = new Hono().get('/', requireAuth, requireOrganization, async (c) => {
  const userOrg = c.get('userOrganizationInfo');
  const response: GetGitHubIntegrationResponse = await getIntegrationHandler(userOrg);
  return c.json(response);
});

export default app;

/**
 * Get the current GitHub integration status for the user's organization
 * Returns non-sensitive information about the integration
 */
async function getIntegrationHandler(userOrg: {
  organizationId: string;
  role: UserOrganizationRole;
}): Promise<GetGitHubIntegrationResponse> {
  try {
    // Get active GitHub integration for the organization
    const integration = await getActiveGithubIntegration(userOrg.organizationId);

    if (!integration) {
      return {
        connected: false,
      };
    }

    // Return non-sensitive integration data
    return {
      connected: true,
      integration: {
        id: integration.id,
        github_org_name: integration.githubOrgName || '',
        github_org_id: integration.githubOrgId,
        installation_id: integration.installationId,
        installed_at: integration.createdAt,
        last_used_at: integration.lastUsedAt,
      },
    };
  } catch (error) {
    console.error('Failed to get GitHub integration:', error);

    // Return disconnected on error rather than throwing
    return {
      connected: false,
    };
  }
}
