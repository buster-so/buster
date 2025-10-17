import type { CurrencyResponse } from '@buster/server-shared/dictionary';
import { Hono } from 'hono';
import { requireAuth } from '../../../../middleware/auth';
import { CURRENCIES_MAP } from './config';

const app = new Hono();

app.get('/', requireAuth, async (c) => {
  const response: CurrencyResponse = CURRENCIES_MAP;

  return c.json(response);
});

export default app;
