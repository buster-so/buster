import { SlackError } from '@buster/server-shared/slack';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { slackWebhookValidator } from '../../../middleware/slack-webhook-validator';
import { handleSlackEventsEndpoint } from './events';
import { slackHandler } from './handler';

const app = new Hono()
  // Public endpoints (no auth required for OAuth flow)
  .post('/auth/init', requireAuth, async (c) => {
    return await slackHandler.initiateOAuth(c);
  })
  .get('/auth/callback', async (c) => {
    return await slackHandler.handleOAuthCallback(c);
  })
  // Protected endpoints
  .get('/integration', requireAuth, async (c) => {
    return await slackHandler.getIntegration(c);
  })
  .put('/integration', requireAuth, async (c) => {
    return await slackHandler.updateIntegration(c);
  })
  .get('/channels', requireAuth, async (c) => {
    return await slackHandler.getChannels(c);
  })
  .delete('/integration', requireAuth, async (c) => {
    return await slackHandler.removeIntegration(c);
  })
  // Events endpoint (no auth required for Slack webhooks)
  .post('/events', slackWebhookValidator(), handleSlackEventsEndpoint)
  // Error handling
  .onError((e, c) => {
    if (e instanceof SlackError) {
      return c.json(e.toResponse(), e.status_code);
    }
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    console.error('Unhandled error in Slack routes:', e);
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
