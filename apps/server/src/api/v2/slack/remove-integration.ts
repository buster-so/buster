import { getUserOrganizationId } from '@buster/database';
import { type RemoveIntegrationResponse, SlackError } from '@buster/server-shared/slack';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createSlackOAuthService } from './services/slack-oauth-service';

export async function removeIntegrationHandler(c: Context): Promise<Response> {
  const user = c.get('busterUser');

  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const organizationGrant = await getUserOrganizationId(user.id);

  if (!organizationGrant) {
    throw new HTTPException(400, { message: 'Organization not found' });
  }

  try {
    const slackOAuthService = createSlackOAuthService();
    const result = await slackOAuthService.removeIntegration(
      organizationGrant.organizationId,
      user.id
    );

    if (!result.success) {
      throw new SlackError(
        result.error || 'Failed to remove integration',
        404,
        'INTEGRATION_NOT_FOUND'
      );
    }

    return c.json<RemoveIntegrationResponse>({
      message: 'Slack integration removed successfully',
    });
  } catch (error) {
    console.error('Failed to remove integration:', error);

    if (error instanceof SlackError) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Failed to remove integration' });
  }
}
