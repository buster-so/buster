import type { User } from '@buster/database/queries';
import {
  type CreateDataSourceRequest,
  CreateDataSourceRequestSchema,
  type CreateDataSourceResponse,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createDataSourceHandler } from './create-data-source';

const app = new Hono();

export const createDataSourceRoute = app.post(
  '/',
  zValidator('json', CreateDataSourceRequestSchema),
  async (c) => {
    try {
      const user = c.get('busterUser') as User;

      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const request = c.req.valid('json') as CreateDataSourceRequest;
      const response = await createDataSourceHandler(user, request);
      return c.json(response as CreateDataSourceResponse, 201);
    } catch (error) {
      // Log errors only
      if (!(error instanceof HTTPException)) {
        console.error('[POST /data-sources] Unexpected error', {
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
