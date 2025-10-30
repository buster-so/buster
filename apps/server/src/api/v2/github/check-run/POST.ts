import { getGithubIntegrationByOrganizationId } from '@buster/database/queries';
import { createInstallationOctokit } from '@buster/github';
import type { CheckRunCreateRequest } from '@buster/server-shared/github';
import { CheckRunCreateSchema } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth, requireOrganization } from '../../../../middleware/auth';

/**
 * Handler function to create a GitHub check run
 * Can be reused in other parts of the codebase
 */
export async function createCheckRunHandler(
  organizationId: string,
  requestData: CheckRunCreateRequest
) {
  console.info('Creating GitHub check run:', {
    organizationId,
    repo: `${requestData.owner}/${requestData.repo}`,
    checkName: requestData.name,
  });

  // Get the Github App installation for the organization
  const installation = await getGithubIntegrationByOrganizationId(organizationId);

  if (!installation?.installationId) {
    throw new Error('No active GitHub integration found for organization');
  }

  // Create an Installation Octokit client
  const octokit = await createInstallationOctokit(installation.installationId);

  // Create the check run
  const { data } = await octokit.rest.checks.create({
    owner: requestData.owner,
    repo: requestData.repo,
    name: requestData.name,
    head_sha: requestData.head_sha,
    status: requestData.status || 'queued',
    ...(requestData.external_id && { external_id: requestData.external_id }),
    ...(requestData.started_at && { started_at: requestData.started_at }),
  });

  console.info('Successfully created check run:', {
    checkRunId: data.id,
    name: data.name,
    status: data.status,
  });

  return data;
}

const app = new Hono().post(
  '/',
  requireAuth,
  requireOrganization,
  zValidator('json', CheckRunCreateSchema),
  async (c) => {
    const userOrg = c.get('userOrganizationInfo');
    const requestData = c.req.valid('json');

    try {
      const checkRun = await createCheckRunHandler(userOrg.organizationId, requestData);
      return c.json({ check_run: checkRun });
    } catch (error) {
      console.error('Failed to create check run:', error);
      return c.json(
        {
          error: 'Failed to create check run',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default app;
