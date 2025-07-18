import type { Context } from 'hono';
import { createSlackOAuthService } from './services/slack-oauth-service';

export async function handleOAuthCallbackHandler(c: Context): Promise<Response> {
  const query = c.req.query();

  if (query.error === 'access_denied') {
    return c.redirect('/app/settings/integrations?status=cancelled');
  }

  if (!query.code || !query.state) {
    return c.redirect('/app/settings/integrations?status=error&error=invalid_parameters');
  }

  try {
    const slackOAuthService = createSlackOAuthService();
    const result = await slackOAuthService.handleOAuthCallback({
      code: query.code,
      state: query.state,
    });

    if (!result.success) {
      const errorParam = encodeURIComponent(result.error || 'Unknown error');
      return c.redirect(`/app/settings/integrations?status=error&error=${errorParam}`);
    }

    const returnUrl = result.metadata?.returnUrl || '/app/settings/integrations';
    const workspaceParam = result.teamName
      ? `&workspace=${encodeURIComponent(result.teamName)}`
      : '';

    return c.redirect(`${returnUrl}?status=success${workspaceParam}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorParam = encodeURIComponent(error instanceof Error ? error.message : 'Unknown error');
    return c.redirect(`/app/settings/integrations?status=error&error=${errorParam}`);
  }
}
