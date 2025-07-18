import { getUserOrganizationId } from '@buster/database';
import {
  type GetIntegrationResponse,
  GetIntegrationResponseSchema,
} from '@buster/server-shared/slack';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createSlackOAuthService } from './services/slack-oauth-service';

export async function getIntegrationHandler(c: Context): Promise<Response> {
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

    const response: GetIntegrationResponse = {
      connected: status.connected,
      ...(status.integration && {
        integration: {
          id: status.integration.id,
          team_name: status.integration.teamName,
          team_domain: status.integration.teamDomain,
          installed_at: status.integration.installedAt,
          last_used_at: status.integration.lastUsedAt,
          default_channel: status.integration.defaultChannel,
          default_sharing_permissions: status.integration.defaultSharingPermissions,
        },
      }),
    };

    const validatedResponse = GetIntegrationResponseSchema.safeParse(response);
    if (!validatedResponse.success) {
      console.error('Invalid response format:', validatedResponse.error);
      throw new HTTPException(500, { message: 'Invalid response format' });
    }

    return c.json<GetIntegrationResponse>(validatedResponse.data);
  } catch (error) {
    console.error('Failed to get integration status:', error);
    throw new HTTPException(500, { message: 'Failed to get integration status' });
  }
}
