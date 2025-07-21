import { getUserOrganizationId } from '@buster/database';
import { GitHub } from '@buster/server-shared';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { type GitHubOAuthService, createGitHubOAuthService } from './services/github-oauth-service';

export class GitHubHandler {
  private githubOAuthService: GitHubOAuthService | null = null;
  private _initializationAttempted = false;

  private getGitHubOAuthService(): GitHubOAuthService | null {
    if (!this._initializationAttempted) {
      this._initializationAttempted = true;
      try {
        this.githubOAuthService = createGitHubOAuthService();
      } catch (error) {
        console.error('Failed to initialize GitHubOAuthService:', error);
        this.githubOAuthService = null;
      }
    }
    return this.githubOAuthService;
  }

  async initiateOAuth(c: Context): Promise<Response> {
    try {
      const service = this.getGitHubOAuthService();
      if (!service) {
        throw new GitHub.GitHubError('GitHub integration service is not available', 503);
      }

      if (!service.isEnabled()) {
        throw new GitHub.GitHubError('GitHub integration is not enabled', 503);
      }

      const userId = c.get('userId') as string;
      if (!userId) {
        throw new GitHub.GitHubError('User authentication required', 401);
      }

      const organizationId = await getUserOrganizationId(userId);
      if (!organizationId) {
        throw new GitHub.GitHubError('User organization not found', 404);
      }

      const body = await c.req.json();
      const validatedBody = GitHub.GitHubInitiateOAuthSchema.parse(body);

      const metadata = {
        ...validatedBody,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      };

      const result = await service.initiateOAuth({
        organizationId,
        userId,
        metadata,
      });

      const response: GitHub.GitHubInitiateOAuthResponse = {
        authUrl: result.authUrl,
        state: result.state,
      };

      return c.json(response);
    } catch (error) {
      if (error instanceof GitHub.GitHubError) {
        throw error;
      }

      console.error('Unexpected error in initiateOAuth:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });

      throw new GitHub.GitHubError('Failed to initiate GitHub OAuth', 500);
    }
  }

  async handleOAuthCallback(c: Context): Promise<Response> {
    try {
      const service = this.getGitHubOAuthService();
      if (!service) {
        const errorUrl = new URL('/error', c.req.url);
        errorUrl.searchParams.set('message', 'GitHub integration service is not available');
        return c.redirect(errorUrl.toString());
      }

      const query = c.req.query();
      const validatedQuery = GitHub.GitHubOAuthCallbackSchema.parse(query);

      if (validatedQuery.error) {
        const errorUrl = new URL('/error', c.req.url);
        errorUrl.searchParams.set('message', validatedQuery.error_description || validatedQuery.error);
        return c.redirect(errorUrl.toString());
      }

      const result = await service.handleOAuthCallback({
        code: validatedQuery.code,
        state: validatedQuery.state,
      });

      if (!result.success) {
        const errorUrl = new URL('/error', c.req.url);
        errorUrl.searchParams.set('message', result.error || 'OAuth callback failed');
        return c.redirect(errorUrl.toString());
      }

      const returnUrl = result.metadata?.returnUrl as string;
      const redirectUrl = returnUrl || '/integrations/github?success=true';

      return c.redirect(redirectUrl);
    } catch (error) {
      console.error('Unexpected error in handleOAuthCallback:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });

      const errorUrl = new URL('/error', c.req.url);
      errorUrl.searchParams.set('message', 'OAuth callback failed');
      return c.redirect(errorUrl.toString());
    }
  }

  async getIntegration(c: Context): Promise<Response> {
    try {
      const service = this.getGitHubOAuthService();
      if (!service) {
        throw new GitHub.GitHubError('GitHub integration service is not available', 503);
      }

      const userId = c.get('userId') as string;
      if (!userId) {
        throw new GitHub.GitHubError('User authentication required', 401);
      }

      const organizationId = await getUserOrganizationId(userId);
      if (!organizationId) {
        throw new GitHub.GitHubError('User organization not found', 404);
      }

      const result = await service.getIntegrationStatus(organizationId);

      const response: GitHub.GitHubGetIntegrationResponse = result;

      return c.json(response);
    } catch (error) {
      if (error instanceof GitHub.GitHubError) {
        throw error;
      }

      console.error('Unexpected error in getIntegration:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });

      throw new GitHub.GitHubError('Failed to get GitHub integration status', 500);
    }
  }

  async removeIntegration(c: Context): Promise<Response> {
    try {
      const service = this.getGitHubOAuthService();
      if (!service) {
        throw new GitHub.GitHubError('GitHub integration service is not available', 503);
      }

      const userId = c.get('userId') as string;
      if (!userId) {
        throw new GitHub.GitHubError('User authentication required', 401);
      }

      const organizationId = await getUserOrganizationId(userId);
      if (!organizationId) {
        throw new GitHub.GitHubError('User organization not found', 404);
      }

      const result = await service.removeIntegration(organizationId, userId);

      const response: GitHub.GitHubRemoveIntegrationResponse = result;

      return c.json(response);
    } catch (error) {
      if (error instanceof GitHub.GitHubError) {
        throw error;
      }

      console.error('Unexpected error in removeIntegration:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });

      throw new GitHub.GitHubError('Failed to remove GitHub integration', 500);
    }
  }
}

export const githubHandler = new GitHubHandler();
