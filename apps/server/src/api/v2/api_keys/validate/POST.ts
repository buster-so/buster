import { isApiKeyValid } from '@buster/database/queries';
import type { ValidateApiKeyResponse } from '@buster/server-shared/api';
import { ValidateApiKeyRequestSchema } from '@buster/server-shared/api';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().post(
  '/validate',
  zValidator('json', ValidateApiKeyRequestSchema),
  async (c) => {
    const request = c.req.valid('json');
    const response: ValidateApiKeyResponse = await isApiKeyValid(request.api_key);
    return c.json(response);
  }
);

export default app;




