import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { SlackError, slackHandler } from './handler';

const app = new Hono()
  // Public endpoints (no auth required for OAuth flow)
  .post('/auth/init', requireAuth, slackHandler.initiateOAuth)
  .get('/auth/callback', slackHandler.handleOAuthCallback)
  // Protected endpoints
  .get('/integration', requireAuth, slackHandler.getIntegration)
  .delete('/integration', requireAuth, slackHandler.removeIntegration)
  // Error handling
  .onError((e, c) => {
    if (e instanceof SlackError) {
      return c.json(e.toResponse(), e.statusCode);
    }
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    console.error('Unhandled error in Slack routes:', e);
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
