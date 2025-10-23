import { createGithubIntegration, getGithubIntegrationByInstallationId, updateGithubIntegration } from '@buster/database/queries';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { retrieveInstallationState } from '../../../services/installation-state';

// Define request schemas
const GithubInstallationCallbackSchema = z.object({
  state: z.string().optional(),
  installation_id: z.string().optional(),
  setup_action: z.enum(['install', 'update']).optional(),
  error: z.string().optional(), // GitHub sends this when user cancels
  error_description: z.string().optional(),
});

const app = new Hono().get(
  '/',
  zValidator('query', GithubInstallationCallbackSchema),
  async (c) => {
    const query = c.req.valid('query');
    console.info('GitHub auth callback received', { query });
    const result = await githubInstallationCallbackHandler({
      state: query.state,
      installation_id: query.installation_id,
      setup_action: query.setup_action,
      error: query.error,
      error_description: query.error_description,
    });
    return c.redirect(result.redirectUrl);
  }
);

export default app;

interface CompleteInstallationRequest {
  state?: string | undefined;
  installation_id?: string | undefined;
  setup_action?: 'install' | 'update' | undefined;
  error?: string | undefined;
  error_description?: string | undefined;
}

interface AuthCallbackResult {
  redirectUrl: string;
}

/**
 * Complete the GitHub App installation after user returns from GitHub
 * This is called after the user installs the app on GitHub
 * Returns a redirect URL to send the user to the appropriate page
 */
export async function githubInstallationCallbackHandler(
  request: CompleteInstallationRequest
): Promise<AuthCallbackResult> {
  // Get base URL from environment
  const baseUrl = process.env.BUSTER_URL || '';
  const installationId = `${request.installation_id}`;

  // Handle user cancellation
  if (request.error === 'access_denied') {
    console.info('GitHub App installation cancelled by user');
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=cancelled`,
    };
  }

  // Handle other errors from GitHub
  if (request.error) {
    const errorMessage = request.error_description || request.error;
    console.error('GitHub returned error:', errorMessage);
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=${encodeURIComponent(errorMessage)}`,
    };
  }

  // Check for required parameters
  if (!request.installation_id) {
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=missing_installation_id`,
    };
  }

  console.info(`Completing GitHub installation: installation_id=${request.installation_id}`);

  // Retrieve the state to get user/org context
  // Note: If state is not provided, this might be a direct installation from GitHub
  if (!request.state) {
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=missing_state`,
    };
  }

  const stateData = await retrieveInstallationState(request.state);

  if (!stateData) {
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=invalid_state`,
    };
  }

  try {
    // Check if integration already exists
    const existing = await getGithubIntegrationByInstallationId(installationId);

    if (existing && existing.deletedAt === null) {
      console.info(`GitHub integration already exists for installation ${installationId}`);

      // Update existing integration to ensure it's active
      const updated = await updateGithubIntegration(existing.id, {
        status: 'active',
      });

      if (!updated) {
        throw new Error(`Failed to update integration for installation ${installationId}`);
      }

      return {
        redirectUrl: `${baseUrl}/app/settings/integrations?status=success`
      };
    } else if (existing) {
      return {
        redirectUrl: `${baseUrl}/app/settings/integrations?status=success`,
      };
    }

    // Create new integration
    const integration = await createGithubIntegration({
      installationId: installationId,
      appId: process.env.GITHUB_APP_ID ?? '0',
      githubOrgId: 'unknown',
      githubOrgName: 'pending_webhook_update',
      organizationId: stateData.organizationId,
      userId: stateData.userId,
      status: 'pending',
    });

    if (!integration) {
      throw new Error(`Failed to create integration for installation ${installationId}`);
    }

    console.info(`GitHub App installed successfully for org ${stateData.organizationId}`);

    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=success`,
    };
  } catch (error) {
    console.error('Failed to complete installation:', error);

    const errorMessage = error instanceof Error ? error.message : 'installation_failed';
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=${encodeURIComponent(errorMessage)}`,
    };
  }
}
