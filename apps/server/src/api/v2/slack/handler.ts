import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { createSlackOAuthService } from './services/slack-oauth-service';

// Request schemas
const InitiateOAuthSchema = z.object({
  metadata: z
    .object({
      returnUrl: z.string().optional(),
      source: z.string().optional(),
      projectId: z.string().uuid().optional(),
    })
    .optional(),
});

const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// Custom error class
export class SlackError extends Error {
  constructor(
    message: string,
    public statusCode: 500 | 400 | 401 | 403 | 404 | 409 | 503 = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'SlackError';
  }

  toResponse() {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

export class SlackHandler {
  private slackOAuthService = createSlackOAuthService();

  /**
   * POST /api/v2/slack/auth/init
   * Initiate OAuth flow
   */
  async initiateOAuth(c: Context) {
    try {
      // Check if integration is enabled
      if (!this.slackOAuthService.isEnabled()) {
        return c.json(
          {
            error: 'Slack integration is not enabled',
            code: 'INTEGRATION_DISABLED',
          },
          503
        );
      }

      // Get authenticated user context
      const user = c.get('busterUser');
      const organizationId = c.get('organizationId');

      if (!user || !organizationId) {
        throw new HTTPException(401, { message: 'Authentication required' });
      }

      // Parse request body
      const body = await c.req.json().catch(() => ({}));
      const parsed = InitiateOAuthSchema.safeParse(body);

      const metadata = parsed.success ? parsed.data.metadata : undefined;

      // Add IP address to metadata
      const enrichedMetadata = {
        ...metadata,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      };

      // Initiate OAuth flow
      const result = await this.slackOAuthService.initiateOAuth({
        organizationId,
        userId: user.id,
        metadata: enrichedMetadata,
      });

      return c.json(result);
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

  /**
   * GET /api/v2/slack/auth/callback
   * Handle OAuth callback from Slack
   */
  async handleOAuthCallback(c: Context) {
    try {
      // Parse query parameters
      const query = c.req.query();
      const parsed = OAuthCallbackSchema.safeParse(query);

      if (!parsed.success) {
        // Handle user denial
        if (query.error === 'access_denied') {
          return c.redirect('/settings/integrations?status=cancelled');
        }

        console.error('Invalid OAuth callback parameters:', parsed.error);
        return c.redirect('/settings/integrations?status=error&error=invalid_parameters');
      }

      // Handle OAuth callback
      const result = await this.slackOAuthService.handleOAuthCallback({
        code: parsed.data.code,
        state: parsed.data.state,
      });

      if (!result.success) {
        const errorParam = encodeURIComponent(result.error || 'unknown_error');
        return c.redirect(`/settings/integrations?status=error&error=${errorParam}`);
      }

      // Use metadata to determine return URL
      const returnUrl = result.metadata?.returnUrl || '/settings/integrations';
      const workspaceParam = result.teamName
        ? `&workspace=${encodeURIComponent(result.teamName)}`
        : '';

      return c.redirect(`${returnUrl}?status=success${workspaceParam}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'callback_failed';
      return c.redirect(
        `/settings/integrations?status=error&error=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  /**
   * GET /api/v2/slack/integration
   * Get current integration status
   */
  async getIntegration(c: Context) {
    try {
      const organizationId = c.get('organizationId');

      if (!organizationId) {
        throw new HTTPException(400, { message: 'Organization context required' });
      }

      const status = await this.slackOAuthService.getIntegrationStatus(organizationId);

      return c.json(status);
    } catch (error) {
      console.error('Failed to get integration status:', error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new SlackError(
        error instanceof Error ? error.message : 'Failed to get integration status',
        500,
        'GET_INTEGRATION_ERROR'
      );
    }
  }

  /**
   * DELETE /api/v2/slack/integration
   * Remove Slack integration
   */
  async removeIntegration(c: Context) {
    try {
      const user = c.get('busterUser');
      const organizationId = c.get('organizationId');

      if (!user || !organizationId) {
        throw new HTTPException(401, { message: 'Authentication required' });
      }

      const result = await this.slackOAuthService.removeIntegration(organizationId, user.id);

      if (!result.success) {
        throw new SlackError(
          result.error || 'Failed to remove integration',
          404,
          'INTEGRATION_NOT_FOUND'
        );
      }

      return c.json({
        message: 'Slack integration removed successfully',
      });
    } catch (error) {
      console.error('Failed to remove integration:', error);

      if (error instanceof HTTPException || error instanceof SlackError) {
        throw error;
      }

      throw new SlackError(
        error instanceof Error ? error.message : 'Failed to remove integration',
        500,
        'REMOVE_INTEGRATION_ERROR'
      );
    }
  }
}

// Export singleton instance
export const slackHandler = new SlackHandler();
