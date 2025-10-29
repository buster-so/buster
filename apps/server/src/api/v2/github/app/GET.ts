import {
  getGithubIntegrationByOrganizationId,
  getGithubIntegrationRequestByOrganizationId,
} from '@buster/database/queries';
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
    const integration = await getGithubIntegrationByOrganizationId(userOrg.organizationId);

    if (integration) {
      // Return non-sensitive integration data
      return {
        connected: true,
        status: integration.status,
        integration: {
          id: integration.id,
          github_org_name: integration.githubOrgName || '',
          github_org_id: integration.githubOrgId,
          installation_id: integration.installationId,
          installed_at: integration.createdAt,
          status: integration.status,
        },
      };
    }

    // Check for pending request if no integration found
    const pendingRequest = await getGithubIntegrationRequestByOrganizationId(
      userOrg.organizationId
    );

    if (pendingRequest) {
      return {
        connected: false,
        status: 'pending',
      };
    }

    // No integration or pending request found
    return {
      connected: false,
    };
  } catch (error) {
    console.error('Failed to get GitHub integration:', error);

    // Return disconnected on error rather than throwing
    return {
      connected: false,
    };
  }
}
