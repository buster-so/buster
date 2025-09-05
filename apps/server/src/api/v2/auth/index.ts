import { validateApiKeyRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { validateApiKeyHandler } from './validate-api-key';

const app = new Hono();

/**
 * POST /api/v2/auth/validate-api-key
 * Validates an API key
 */
app.post('/validate-api-key', zValidator('json', validateApiKeyRequestSchema), async (c) => {
  const request = c.req.valid('json');
  const response = await validateApiKeyHandler(request);
  return c.json(response);
});

export default app;
