import { deleteApiKey } from '@buster/database/queries';
import type { DeleteApiKeyResponse } from '@buster/server-shared/api';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

const ApiKeyIdParamSchema = z.object({
  id: z.string().uuid().describe('API key ID'),
});

const app = new Hono().delete('/:id', zValidator('param', ApiKeyIdParamSchema), async (c) => {
  const params = c.req.valid('param');
  const user = c.get('busterUser');

  const success = await deleteApiKey(params.id, user.id);

  if (!success) {
    throw new HTTPException(404, { message: 'API key not found' });
  }

  const response: DeleteApiKeyResponse = {
    success: true,
    message: 'API key deleted successfully',
  };

  return c.json(response);
});

export default app;
