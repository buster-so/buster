import { getGithubIntegrationByOrganizationId } from '@buster/database/queries';
import { createInstallationOctokit } from '@buster/github';
import type { CheckRunGetRequest } from '@buster/server-shared/github';
import { CheckRunGetSchema } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth, requireOrganization } from '../../../../middleware/auth';

/**
 * Handler function to get a GitHub check run
 * Can be reused in other parts of the codebase
 */
export async function getCheckRunHandler(organizationId: string, requestData: CheckRunGetRequest) {
  console.info('Getting GitHub check run:', {
    organizationId,
    repo: `${requestData.owner}/${requestData.repo}`,
    checkRunId: requestData.check_run_id,
  });

  // Get the Github App installation for the organization
  const installation = await getGithubIntegrationByOrganizationId(organizationId);

  if (!installation?.installationId) {
    throw new Error('No active GitHub integration found for organization');
  }

  // Create an Installation Octokit client
  const octokit = await createInstallationOctokit(installation.installationId);

  // Get the check run
  const { data } = await octokit.rest.checks.get({
    owner: requestData.owner,
    repo: requestData.repo,
    check_run_id: requestData.check_run_id,
  });

  console.info('Successfully retrieved check run:', {
    checkRunId: data.id,
    name: data.name,
    status: data.status,
  });

  return data;
}

const app = new Hono().get(
  '/',
  requireAuth,
  requireOrganization,
  zValidator('query', CheckRunGetSchema),
  async (c) => {
    const userOrg = c.get('userOrganizationInfo');
    const queryData = c.req.valid('query');

    try {
      const checkRun = await getCheckRunHandler(userOrg.organizationId, queryData);
      return c.json({ check_run: checkRun });
    } catch (error) {
      console.error('Failed to get check run:', error);
      return c.json(
        {
          error: 'Failed to get check run',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default app;
