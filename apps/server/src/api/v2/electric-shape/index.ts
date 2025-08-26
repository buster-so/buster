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
    const url = await getElectricShapeUrl(c.req.url);
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

      if (!proxiedUrl) {
        return c.json({ error: 'Unable to process request' }, 500);
      }

      if (proxiedUrl instanceof Response) {
        return proxiedUrl;
      }

      const response = await createProxiedResponse(proxiedUrl);

      return response;
    } catch (_error) {
      // If it's already an HTTP error (like 403/404), re-throw it
      if (_error && typeof _error === 'object' && 'getResponse' in _error) {
        throw _error;
      }

      // Otherwise, log and throw generic error
      console.error('Error fetching data from Electric Shape', _error);
      throw errorResponse('Error fetching data from Electric Shape', 500);
    }
  });

export default app;
