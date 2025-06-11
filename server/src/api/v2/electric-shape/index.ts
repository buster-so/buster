import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';
import { errorResponse } from '../../../utils/response';
import { getUserIdFromContext } from '../../../utils/users';
import { createProxiedResponse, getElectricShapeUrl } from './_helpers';
import proxyRouter from './_proxyRouterConfig';

const electricShapeSchema = z.object({
  table: z.string(),
});

const app = new Hono()
  .use('*', requireAuth)
  // GET route for Electric SQL proxy
  .get('/', zValidator('query', electricShapeSchema), async (c) => {
    const url = getElectricShapeUrl(c.req.url);
    const table = url.searchParams.get('table');
    const userId = getUserIdFromContext(c);

    const proxy = proxyRouter[table as keyof typeof proxyRouter];

    if (!proxy) {
      return c.json(
        {
          error: `The requested table '${table}' is not available for Electric Shape processing. Please check the table name and try again.`,
        },
        404
      );
    }

    try {
      const proxiedUrl = await proxy(url, userId, c);

      if (proxiedUrl instanceof Response) {
        return proxiedUrl;
      }

      const response = await createProxiedResponse(proxiedUrl);

      return response;
    } catch (error) {
      return errorResponse(c, error, 500);
    }
  });

export default app;
