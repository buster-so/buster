import { getUserOrganizationId } from '@buster/database';
import { type GetChannelsResponse, SlackError } from '@buster/server-shared/slack';
import { SlackChannelService } from '@buster/slack';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createSlackOAuthService } from './services/slack-oauth-service';

export async function getChannelsHandler(c: Context): Promise<Response> {
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
    const status = await slackOAuthService.getIntegrationStatus(organizationGrant.organizationId);

    if (!status.connected || !status.integration) {
      throw new SlackError('No active Slack integration found', 404, 'INTEGRATION_NOT_FOUND');
    }

    const accessToken = await slackOAuthService.getTokenFromVault(status.integration.id);

    if (!accessToken) {
      throw new SlackError('Unable to retrieve Slack access token', 500, 'TOKEN_RETRIEVAL_ERROR');
    }

    const channelService = new SlackChannelService();
    const channels = await channelService.getAvailableChannels(accessToken);

    return c.json<GetChannelsResponse>({
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_archived: channel.is_archived,
        is_member: channel.is_member,
      })),
    });
  } catch (error) {
    console.error('Failed to get channels:', error);

    if (error instanceof SlackError) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Failed to retrieve channels' });
  }
}
