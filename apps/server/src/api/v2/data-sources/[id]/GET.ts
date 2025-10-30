import type { User } from '@buster/database/queries';
import type { GetDataSourceResponse } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { getDataSourceHandler } from '../get-data-source';

const app = new Hono();

// Path parameter validation schema
const ParamsSchema = z.object({
  id: z.string().uuid('Invalid data source ID format'),
});

export const getDataSourceRoute = app.get('/', zValidator('param', ParamsSchema), async (c) => {
  try {
    const user = c.get('busterUser') as User;

    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const params = c.req.valid('param');
    const response = await getDataSourceHandler(user, params.id);
    return c.json(response as GetDataSourceResponse, 200);
  } catch (error) {
    // Log errors only
    if (!(error instanceof HTTPException)) {
      console.error('[GET /data-sources/:id] Unexpected error', {
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
});

export default app;
