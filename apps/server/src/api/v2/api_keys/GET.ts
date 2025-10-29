import { listApiKeys } from '@buster/database/queries';
import type { GetApiKeysResponse } from '@buster/server-shared/api';
import { Hono } from 'hono';

const app = new Hono().get('/', async (c) => {
  const user = c.get('busterUser');
  const apiKeys = await listApiKeys(user.id);

  const response: GetApiKeysResponse = {
    api_keys: apiKeys,
  };

  return c.json(response);
});

export default app;
