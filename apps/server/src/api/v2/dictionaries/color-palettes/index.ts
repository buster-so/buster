import type { ColorPaletteDictionariesResponse } from '@buster/server-shared/dictionary';
import { Hono } from 'hono';
import { ALL_DICTIONARY_THEMES } from './config';

const app = new Hono();

app.get('/', async (c) => {
  const response: ColorPaletteDictionariesResponse = ALL_DICTIONARY_THEMES;
  return c.json(response);
});

export default app;
