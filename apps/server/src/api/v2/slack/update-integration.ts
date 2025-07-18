import { getUserOrganizationId } from '@buster/database';
import {
  SlackError,
  type UpdateIntegrationRequest,
  type UpdateIntegrationResponse,
  UpdateIntegrationSchema,
} from '@buster/server-shared/slack';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { updateIntegrationSettings } from './services/slack-helpers';

export async function updateIntegrationHandler(c: Context): Promise<Response> {
  const user = c.get('busterUser');

  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const organizationGrant = await getUserOrganizationId(user.id);

  if (!organizationGrant) {
    throw new HTTPException(400, { message: 'Organization not found' });
  }

  try {
    const body: unknown = await c.req.json();
    const parsed = UpdateIntegrationSchema.safeParse(body);

    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid request body' });
    }

    const request: UpdateIntegrationRequest = parsed.data;

    await updateIntegrationSettings(organizationGrant.organizationId, {
      defaultChannel: request.default_channel,
      defaultSharingPermissions: request.default_sharing_permissions,
    });

    return c.json<UpdateIntegrationResponse>({
      message: 'Integration settings updated successfully',
    });
  } catch (error) {
    console.error('Failed to update integration:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    if (error instanceof Error && error.message.includes('not found')) {
      throw new SlackError('Slack integration not found', 404, 'INTEGRATION_NOT_FOUND');
    }

    throw new HTTPException(500, { message: 'Failed to update integration' });
  }
}
