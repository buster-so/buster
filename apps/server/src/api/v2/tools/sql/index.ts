import { RunSqlRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';
import { runSqlHandler } from './POST';

const app = new Hono()
  // Apply API key authentication middleware to all routes
  .use('*', createApiKeyAuthMiddleware())

  // POST /tools/sql - Execute SQL query against data source with API key auth
  .post('/', zValidator('json', RunSqlRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const apiKeyContext = c.get('apiKey');

    if (!apiKeyContext) {
      throw new HTTPException(401, {
        message: 'API key authentication required',
      });
    }

    const response = await runSqlHandler(request, apiKeyContext);

    return c.json(response);
  })

  // Error handler for SQL tool routes
  .onError((err, c) => {
    console.error('SQL tool API error:', err);

    // Let HTTPException responses pass through
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    // Default error response
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
