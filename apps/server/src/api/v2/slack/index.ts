import {
  InitiateOAuthSchema,
  SlackError,
  UpdateIntegrationSchema,
} from '@buster/server-shared/slack';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';
import { slackWebhookValidator } from '../../../middleware/slack-webhook-validator';
import { handleSlackEventsEndpoint } from './events';
import { getChannelsHandler } from './get-channels';
import { getIntegrationHandler } from './get-integration';
import { handleOAuthCallbackHandler } from './handle-oauth-callback';
import { initiateOAuthHandler } from './initiate-oauth';
import { removeIntegrationHandler } from './remove-integration';
import { updateIntegrationHandler } from './update-integration';

const app = new Hono()
  // Public endpoints (no auth required for OAuth flow)
  .post('/auth/init', requireAuth, zValidator('json', z.object({}).merge(InitiateOAuthSchema.unwrap())), initiateOAuthHandler)
  .get('/auth/callback', handleOAuthCallbackHandler)
  // Protected endpoints
  .get('/integration', requireAuth, getIntegrationHandler)
  .put(
    '/integration',
    requireAuth,
    zValidator('json', UpdateIntegrationSchema),
    updateIntegrationHandler
  )
  .get('/channels', requireAuth, getChannelsHandler)
  .delete('/integration', requireAuth, removeIntegrationHandler)
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
