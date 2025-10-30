import type { User } from '@buster/database/queries';
import {
  type ListDataSourcesQuery,
  ListDataSourcesQuerySchema,
  type ListDataSourcesResponse,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { listDataSourcesHandler } from './list-data-sources';

const app = new Hono();

export const listDataSourcesRoute = app.get(
  '/',
  zValidator('query', ListDataSourcesQuerySchema),
  async (c) => {
    try {
      const user = c.get('busterUser') as User;

      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const query = c.req.valid('query') as ListDataSourcesQuery;
      const response = await listDataSourcesHandler(user, query);
      return c.json(response as ListDataSourcesResponse, 200);
    } catch (error) {
      // Log errors only
      if (!(error instanceof HTTPException)) {
        console.error('[GET /data-sources] Unexpected error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        });
      }

      // Re-throw HTTPExceptions as-is
      if (error instanceof HTTPException) {
        throw error;
      }

      // Wrap other errors as 500
      throw new HTTPException(500, {
        message: 'Internal server error',
      });
    }
  }
);

export default app;
