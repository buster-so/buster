import type { Currency } from '@buster/server-shared/currency';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { CURRENCIES_MAP } from './config';

const app = new Hono();

app.use('*', requireAuth).get('/', async (c) => {
  return c.json<Currency[]>(CURRENCIES_MAP);
});

export default app;
