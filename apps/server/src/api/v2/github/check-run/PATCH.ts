import { getGithubIntegrationByOrganizationId } from '@buster/database/queries';
import { type ChecksUpdateParams, createInstallationOctokit } from '@buster/github';
import type { CheckRunUpdateRequest } from '@buster/server-shared/github';
import { CheckRunUpdateSchema } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth, requireOrganization } from '../../../../middleware/auth';

/**
 * Handler function to update a GitHub check run
 * Can be reused in other parts of the codebase
 */
export async function updateCheckRunHandler(
  organizationId: string,
  requestData: CheckRunUpdateRequest
) {
  console.info('Updating GitHub check run:', {
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

  // Update the check run
  // Filter out undefined values to match Octokit's exact optional property types
  const updateParams: ChecksUpdateParams = {
    owner: requestData.owner,
    repo: requestData.repo,
    check_run_id: requestData.check_run_id,
  };

  // Only add defined properties
  if (requestData.name !== undefined) updateParams.name = requestData.name;
  if (requestData.details_url !== undefined) updateParams.details_url = requestData.details_url;
  if (requestData.external_id !== undefined) updateParams.external_id = requestData.external_id;
  if (requestData.started_at !== undefined) updateParams.started_at = requestData.started_at;
  if (requestData.status !== undefined) updateParams.status = requestData.status;
  if (requestData.conclusion !== undefined) updateParams.conclusion = requestData.conclusion;
  if (requestData.completed_at !== undefined) updateParams.completed_at = requestData.completed_at;
  if (requestData.actions !== undefined) updateParams.actions = requestData.actions;

  // Handle output object - filter out undefined nested properties
  if (requestData.output !== undefined) {
    const output = {
      title: requestData.output.title,
      summary: requestData.output.summary,
    };
    if (requestData.output.text !== undefined) {
      Object.assign(output, { text: requestData.output.text });
    }
    if (requestData.output.annotations !== undefined) {
      Object.assign(output, { annotations: requestData.output.annotations });
    }
    if (requestData.output.images !== undefined) {
      Object.assign(output, { images: requestData.output.images });
    }
    updateParams.output = output;
  }

  const { data } = await octokit.rest.checks.update(updateParams);

  console.info('Successfully updated check run:', {
    checkRunId: data.id,
    name: data.name,
    status: data.status,
  });

  return data;
}

const app = new Hono().patch(
  '/',
  requireAuth,
  requireOrganization,
  zValidator('json', CheckRunUpdateSchema),
  async (c) => {
    const userOrg = c.get('userOrganizationInfo');
    const requestData = c.req.valid('json');

    try {
      const checkRun = await updateCheckRunHandler(userOrg.organizationId, requestData);
      return c.json({ check_run: checkRun });
    } catch (error) {
      console.error('Failed to update check run:', error);
      return c.json(
        {
          error: 'Failed to update check run',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default app;
