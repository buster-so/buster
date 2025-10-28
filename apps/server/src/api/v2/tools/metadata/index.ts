import { GetMetadataRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';
import { getMetadataHandler } from './GET';

const app = new Hono()
  // Apply API key authentication middleware to all routes
  .use('*', createApiKeyAuthMiddleware())

  // GET /tools/metadata - Retrieve dataset metadata with API key auth
  .get('/', zValidator('query', GetMetadataRequestSchema), async (c) => {
    const request = c.req.valid('query');
    const apiKeyContext = c.get('apiKey');

    if (!apiKeyContext) {
      throw new HTTPException(401, {
        message: 'API key authentication required',
      });
    }

    const response = await getMetadataHandler(request, apiKeyContext);

    return c.json(response);
  })

  // Error handler for metadata tool routes
  .onError((err, c) => {
    console.error('Metadata tool API error:', err);

    // Handle HTTPException - return JSON format for consistent error handling
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }

    // Default error response for unexpected errors
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return c.json({ error: errorMessage }, 500);
  });

export default app;
