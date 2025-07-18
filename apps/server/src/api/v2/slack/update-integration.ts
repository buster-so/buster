import { getUserOrganizationId } from '@buster/database';
import {
  SlackError,
  type UpdateIntegrationRequest,
  type UpdateIntegrationResponse,
  UpdateIntegrationResponseSchema,
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
    const request = c.req.valid('json') as UpdateIntegrationRequest;

    const updateData: {
      defaultChannel?: { id: string; name: string };
      defaultSharingPermissions?: 'shareWithWorkspace' | 'shareWithChannel' | 'noSharing';
    } = {};

    if (request.default_channel) {
      updateData.defaultChannel = request.default_channel;
    }
    if (request.default_sharing_permissions) {
      updateData.defaultSharingPermissions = request.default_sharing_permissions;
    }

    await updateIntegrationSettings(organizationGrant.organizationId, updateData);

    const response: UpdateIntegrationResponse = {
      message: 'Integration settings updated successfully',
      default_channel: request.default_channel,
      default_sharing_permissions: request.default_sharing_permissions,
    };

    const validatedResponse = UpdateIntegrationResponseSchema.safeParse(response);
    if (!validatedResponse.success) {
      throw new HTTPException(500, { message: 'Invalid response format' });
    }

    return c.json<UpdateIntegrationResponse>(validatedResponse.data);
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
