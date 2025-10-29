import type {
  CreateApiKeyResponse,
  DeleteApiKeyResponse,
  GetApiKeyResponse,
  GetApiKeysResponse,
  ValidateApiKeyResponse,
} from '@buster/server-shared/api';
import { CreateApiKeyRequestSchema, ValidateApiKeyRequestSchema } from '@buster/server-shared/api';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';
import { listApiKeysHandler } from './GET';
import { deleteApiKeyHandler } from './id/DELETE';
import { getApiKeyHandler } from './id/GET';
import { createApiKeyHandler } from './POST';
import { validateApiKeyHandler } from './validate/POST';

const ApiKeyIdParamSchema = z.object({
  id: z.string().uuid().describe('API key ID'),
});

const app = new Hono()
  // POST /api_keys/validate - No authentication required
  .post('/validate', zValidator('json', ValidateApiKeyRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const response: ValidateApiKeyResponse = await validateApiKeyHandler(request);
    return c.json(response);
  })

  // All other routes require authentication
  .use('*', requireAuth)

  // GET /api_keys - List all API keys
  .get('/', async (c) => {
    const user = c.get('busterUser');
    const response: GetApiKeysResponse = await listApiKeysHandler(user);
    return c.json(response);
  })

  // POST /api_keys - Create new API key
  .post('/', zValidator('json', CreateApiKeyRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const response: CreateApiKeyResponse = await createApiKeyHandler(request, user);
    return c.json(response);
  })

  // GET /api_keys/:id - Get single API key
  .get('/:id', zValidator('param', ApiKeyIdParamSchema), async (c) => {
    const params = c.req.valid('param');
    const user = c.get('busterUser');
    const response: GetApiKeyResponse = await getApiKeyHandler(params.id, user);
    return c.json(response);
  })

  // DELETE /api_keys/:id - Delete API key
  .delete('/:id', zValidator('param', ApiKeyIdParamSchema), async (c) => {
    const params = c.req.valid('param');
    const user = c.get('busterUser');
    const response: DeleteApiKeyResponse = await deleteApiKeyHandler(params.id, user);
    return c.json(response);
  });

export default app;
