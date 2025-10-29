import { createGithubIntegration, updateGithubIntegration } from '@buster/database/queries';
import { createInstallationOctokit } from '@buster/github';
import {
  type GithubInstallationCallbackRequest,
  GithubInstallationCallbackSchema,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { retrieveInstallationState } from '../../../helpers/installation-state';

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

type AuthCallbackResult = {
  redirectUrl: string;
};

/**
 * Complete the GitHub App installation after user returns from GitHub
 * This is called after the user installs the app on GitHub
 * Returns a redirect URL to send the user to the appropriate page
 */
export async function githubInstallationCallbackHandler(
  request: GithubInstallationCallbackRequest
): Promise<AuthCallbackResult> {
  // Get base URL from environment
  const baseUrl = process.env.BUSTER_URL || '';

  try {
    // Check if state and installation_id were provided
    if (request.state && request.installation_id) {
      const installationId = `${request.installation_id}`;

      const stateData = await retrieveInstallationState(request.state);
      if (!stateData) {
        return {
          redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=invalid_state`,
        };
      }

      // Create the GitHub integration will not fail on conflict. This makes an update, install, or request all safe
      const integration = await createGithubIntegration({
        installationId: installationId,
        appId: process.env.GITHUB_APP_ID ?? '0',
        githubOrgId: 'unknown',
        githubOrgName: 'pending_webhook_update',
        organizationId: stateData.organizationId,
        userId: stateData.userId,
        status: 'pending',
      });

      // If integration was successfully created, get installation details and update
      // Webhook will update but grabbing details now makes the experience better for the user
      if (integration && request.setup_action === 'install') {
        try {
          const octokit = await createInstallationOctokit(installationId);

          const installationDetailsPromise = octokit.rest.apps.getInstallation({
            installation_id: Number.parseInt(installationId, 10),
          });
          const repositoryDetailsPromise = octokit.rest.apps.listReposAccessibleToInstallation();

          const [installationDetails, repositoryDetails] = await Promise.all([
            installationDetailsPromise,
            repositoryDetailsPromise,
          ]);

          // Extract account information - account can be User or Organization
          const account = installationDetails.data.account;
          const accountLogin =
            account && 'login' in account
              ? account.login
              : account && 'name' in account
                ? account.name
                : 'unknown';
          const accountId = account?.id?.toString() || 'unknown';

          await updateGithubIntegration(integration.id, {
            githubOrgName: accountLogin,
            githubOrgId: accountId,
            permissions: installationDetails.data.permissions as Record<string, string>,
            accessibleRepositories: repositoryDetails.data.repositories,
            status: 'active',
          });
        } catch (error) {
          console.error('Failed to fetch or update installation details:', error);
          // Don't fail the whole flow if we can't get details - webhook will update later
        }
      }

      return {
        redirectUrl: `${baseUrl}/app/settings/integrations?status=success`,
      };
    }

    // If state and installation_id aren't provided, check for errors
    if (request.error) {
      const errorMessage = request.error_description || request.error;
      console.error('GitHub returned error:', errorMessage);
      return {
        redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=${encodeURIComponent(errorMessage)}`,
      };
    }

    // No state/installation_id and no error - just return to integrations page
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=failure`,
    };
  } catch (error) {
    // Catch any unexpected errors and return failure status
    console.error('Error in GitHub installation callback:', error);
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=failure`,
    };
  }
}
