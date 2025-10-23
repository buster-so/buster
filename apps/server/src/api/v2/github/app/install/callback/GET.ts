import { getUserOrganizationId } from '@buster/database/queries';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { handleInstallationCallback } from '../../../services/handle-installation-callback';
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

  // // Create the installation callback payload
  // const callbackPayload = {
  //   action: 'created' as const,
  //   installation: {
  //     id: Number.isNaN(Number(request.installation_id))
  //       ? 0
  //       : Number.parseInt(request.installation_id, 10),
  //     account: {
  //       // These will be updated when the webhook arrives with full details
  //       login: 'pending_webhook_update',
  //       id: 0
  //     },
  //   },
  // };

  try {
    // const result = await handleInstallationCallback({
    //   payload: callbackPayload,
    //   organizationId: stateData.organizationId,
    //   userId: stateData.userId,
    // });

    console.info(`GitHub App installed successfully for org ${stateData.organizationId}`);

    // Include the GitHub org name if available
    // const orgParam = result.githubOrgName ? `&org=${encodeURIComponent(result.githubOrgName)}` : '';

    return {
      // TODO: FIX
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
