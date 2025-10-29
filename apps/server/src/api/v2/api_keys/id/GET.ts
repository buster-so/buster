import { getApiKey } from '@buster/database/queries';
import type { GetApiKeyResponse } from '@buster/server-shared/api';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

const ApiKeyIdParamSchema = z.object({
  id: z.string().uuid().describe('API key ID'),
});

const app = new Hono().get('/:id', zValidator('param', ApiKeyIdParamSchema), async (c) => {
  const params = c.req.valid('param');
  const user = c.get('busterUser');

  const apiKey = await getApiKey(params.id, user.id);

  if (!apiKey) {
    throw new HTTPException(404, { message: 'API key not found' });
  }

  const response: GetApiKeyResponse = apiKey;
  return c.json(response);
});

export default app;
