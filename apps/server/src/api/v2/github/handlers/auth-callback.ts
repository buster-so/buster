import { getSecret, getUserOrganizationId } from '@buster/database';
import { handleInstallationCallback } from '../services/handle-installation-callback';
import { retrieveInstallationState } from '../services/installation-state';
import { SERVER_KEYS } from '@buster/secrets';

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
export async function authCallbackHandler(
  request: CompleteInstallationRequest
): Promise<AuthCallbackResult> {
  // Get base URL from environment

  const baseUrl = await getSecret(SERVER_KEYS.BUSTER_URL);

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

  // Verify the user still has access to the organization
  const userOrg = await getUserOrganizationId(stateData.userId);
  if (!userOrg || userOrg.organizationId !== stateData.organizationId) {
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=unauthorized`,
    };
  }

  // Create the installation callback payload
  // The webhook will arrive shortly with full details, but we can create the record now
  const callbackPayload = {
    action: 'created' as const,
    installation: {
      id: Number.isNaN(Number(request.installation_id))
        ? 0
        : Number.parseInt(request.installation_id, 10),
      account: {
        // These will be updated when the webhook arrives with full details
        id: 0,
        login: 'pending_webhook_update',
      },
    },
  };

  try {
    const result = await handleInstallationCallback({
      payload: callbackPayload,
      organizationId: stateData.organizationId,
      userId: stateData.userId,
    });

    console.info(`GitHub App installed successfully for org ${stateData.organizationId}`);

    // Include the GitHub org name if available
    const orgParam = result.githubOrgName ? `&org=${encodeURIComponent(result.githubOrgName)}` : '';

    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=success${orgParam}`,
    };
  } catch (error) {
    console.error('Failed to complete installation:', error);

    const errorMessage = error instanceof Error ? error.message : 'installation_failed';
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=${encodeURIComponent(errorMessage)}`,
    };
  }
}
