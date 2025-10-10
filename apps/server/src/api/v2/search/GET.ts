import { performTextSearch } from '@buster/search';
import { SearchTextRequestSchema, type SearchTextResponse } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../utils/response';

const app = new Hono()
  .get('/', zValidator('query', SearchTextRequestSchema), async (c) => {
    const user = c.get('busterUser');
    const searchRequest = c.req.valid('query');
    try {
      const response: SearchTextResponse = await performTextSearch(user.id, searchRequest);
      return c.json(response);
    } catch (error) {
      console.error('Error performing text search:', error);
      throw new HTTPException(500, { message: 'Failed to perform search' });
    }
  })
  .onError(standardErrorHandler);

export default app;
