import {
  createGithubIntegration,
  createGithubIntegrationRequest,
  getGithubIntegrationRequestByOrgMemberList,
  softDeleteGithubIntegrationRequest,
} from '@buster/database/queries';
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

    const result = await githubInstallationCallbackHandler({
      state: query.state,
      installation_id: query.installation_id,
      code: query.code,
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
    // Handle error case first
    if (request.error) {
      const errorMessage = request.error_description || request.error;
      console.error('GitHub returned error:', errorMessage);
      return {
        redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=${encodeURIComponent(errorMessage)}`,
      };
    }

    // Handle 'request' setup_action - user requested installation but needs approval
    if (request.setup_action === 'request' && request.code && request.state) {
      return await handleInstallationRequest(request.code, request.state, baseUrl);
    }

    // Handle 'install' setup_action with state - normal installation flow
    if (request.setup_action === 'install' && request.installation_id && request.state) {
      return await handleInstallationWithState(request.installation_id, request.state, baseUrl);
    }

    // Handle 'install' setup_action without state - look for pending request
    if (request.setup_action === 'install' && request.installation_id && !request.state) {
      return await handleInstallationWithoutState(request.installation_id, baseUrl);
    }

    console.error('Unknown GitHub installation callback request', { request });

    // No valid parameters - return to integrations page
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

/**
 * Handle installation request - user requested but didn't install
 * Exchange code for user token and save request details
 */
async function handleInstallationRequest(
  code: string,
  state: string,
  baseUrl: string
): Promise<AuthCallbackResult> {
  const stateData = await retrieveInstallationState(state);
  if (!stateData) {
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=invalid_state`,
    };
  }

  try {
    // Exchange code for access token
    const clientId = process.env.GH_APP_CLIENT_ID;
    const clientSecret = process.env.GH_APP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GitHub App OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token: ${tokenData.error || 'Unknown error'}`);
    }

    // Get user details
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const userData = (await userResponse.json()) as {
      login?: string;
      error?: string;
    };

    if (!userData.login) {
      throw new Error('Failed to get user details');
    }

    // Save the request
    await createGithubIntegrationRequest({
      organizationId: stateData.organizationId,
      userId: stateData.userId,
      githubLogin: userData.login,
    });

    console.info(
      `GitHub installation requested by ${userData.login} for org ${stateData.organizationId}`
    );

    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=pending`,
    };
  } catch (error) {
    console.error('Failed to handle installation request:', error);
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=request_failed`,
    };
  }
}

/**
 * Handle installation with state - normal flow
 */
async function handleInstallationWithState(
  installationId: string,
  state: string,
  baseUrl: string
): Promise<AuthCallbackResult> {
  const stateData = await retrieveInstallationState(state);
  if (!stateData) {
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=invalid_state`,
    };
  }

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

  await createGithubIntegration({
    installationId: installationId,
    appId: process.env.GITHUB_APP_ID ?? '0',
    githubOrgId: accountId,
    githubOrgName: accountLogin,
    organizationId: stateData.organizationId,
    permissions: installationDetails.data.permissions,
    accessibleRepositories: repositoryDetails.data.repositories,
    userId: stateData.userId,
    status: 'active',
  });

  return {
    redirectUrl: `${baseUrl}/app/settings/integrations?status=success`,
  };
}

/**
 * Handle installation without state - look for pending request by checking org members
 */
async function handleInstallationWithoutState(
  installationId: string,
  baseUrl: string
): Promise<AuthCallbackResult> {
  try {
    // Get installation details and organization members
    const octokit = await createInstallationOctokit(installationId);
    const installationDetails = await octokit.rest.apps.getInstallation({
      installation_id: Number.parseInt(installationId, 10),
    });

    const account = installationDetails.data.account;
    const accountLogin =
      account && 'login' in account
        ? account.login
        : account && 'name' in account
          ? account.name
          : null;

    if (!accountLogin) {
      throw new Error('Could not determine GitHub account login');
    }

    const accountId = account?.id?.toString() || 'unknown';

    let orgMembers: string[] = [];

    // Check if this is an organization or user account
    if (account && 'type' in account && account.type === 'Organization') {
      try {
        const membersResponse = await octokit.rest.orgs.listMembers({
          org: accountLogin,
          per_page: 100,
        });
        orgMembers = membersResponse.data.map((member) => member.login);
      } catch (error) {
        console.warn(`Could not list members for org ${accountLogin}:`, error);
      }
    } else {
      orgMembers = [accountLogin];
    }

    const matchingRequest = await getGithubIntegrationRequestByOrgMemberList(orgMembers);
    if (!matchingRequest) {
      return {
        redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=no_matching_request`,
      };
    }

    const repositoryDetails = await octokit.rest.apps.listReposAccessibleToInstallation();

    await createGithubIntegration({
      installationId: installationId,
      appId: process.env.GITHUB_APP_ID ?? '0',
      githubOrgId: accountId,
      githubOrgName: accountLogin,
      organizationId: matchingRequest.organizationId,
      permissions: installationDetails.data.permissions,
      accessibleRepositories: repositoryDetails.data.repositories,
      userId: matchingRequest.userId,
      status: 'active',
    });

    await softDeleteGithubIntegrationRequest(matchingRequest.id);

    console.info(
      `GitHub integration created for ${accountLogin} using pending request from ${matchingRequest.githubLogin} for org ${matchingRequest.organizationId}`
    );

    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=success`,
    };
  } catch (error) {
    console.error('Failed to handle installation without state:', error);
    return {
      redirectUrl: `${baseUrl}/app/settings/integrations?status=error&error=installation_failed`,
    };
  }
}
