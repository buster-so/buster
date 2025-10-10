import { Hono } from 'hono';
import { githubWebhookMiddleware } from '../../../../../middleware/github-webhook-middleware';

// GitHub webhooks actions are created in the github-webhook-middleware.ts file

const app = new Hono().post('/', githubWebhookMiddleware(), async (c) => {
  console.info('Returning 200 for github webhook');
  return c.text('Webhook received', 200);
});

export default app;
