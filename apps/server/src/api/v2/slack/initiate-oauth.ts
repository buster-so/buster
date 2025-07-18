import { getUserOrganizationId } from '@buster/database';
import {
  type InitiateOAuthRequest,
  type InitiateOAuthResponse,
  InitiateOAuthResponseSchema,
  SlackError,
  type SlackErrorResponse,
} from '@buster/server-shared/slack';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createSlackOAuthService } from './services/slack-oauth-service';

export async function initiateOAuthHandler(c: Context): Promise<Response> {
  try {
    const slackOAuthService = createSlackOAuthService();

    if (!slackOAuthService) {
      return c.json<SlackErrorResponse>(
        {
          error: 'Slack integration is not configured',
          code: 'INTEGRATION_NOT_CONFIGURED',
        },
        503
      );
    }

    if (!slackOAuthService.isEnabled()) {
      return c.json<SlackErrorResponse>(
        {
          error: 'Slack integration is not enabled',
          code: 'INTEGRATION_DISABLED',
        },
        503
      );
    }

    const user = c.get('busterUser');

    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const organizationGrant = await getUserOrganizationId(user.id);

    if (!organizationGrant) {
      throw new HTTPException(400, { message: 'Organization not found' });
    }

    const request = c.req.valid('json') as InitiateOAuthRequest;
    const metadata = request?.metadata;

    const enrichedMetadata = {
      ...metadata,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    };

    const result = await slackOAuthService.initiateOAuth({
      organizationId: organizationGrant.organizationId,
      userId: user.id,
      metadata: enrichedMetadata,
    });

    const response: InitiateOAuthResponse = {
      auth_url: result.authUrl,
      state: result.state,
    };

    const validatedResponse = InitiateOAuthResponseSchema.safeParse(response);
    if (!validatedResponse.success) {
      throw new SlackError('Invalid response format', 500, 'INVALID_RESPONSE');
    }

    return c.json<InitiateOAuthResponse>(validatedResponse.data);
  } catch (error) {
    console.error('Failed to initiate OAuth:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    if (error instanceof Error && error.message.includes('already has an active')) {
      throw new SlackError(
        'Organization already has an active Slack integration',
        409,
        'INTEGRATION_EXISTS'
      );
    }

    throw new SlackError(
      error instanceof Error ? error.message : 'Failed to initiate OAuth',
      500,
      'OAUTH_INIT_ERROR'
    );
  }
}
