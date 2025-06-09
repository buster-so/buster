import { requireAuth } from '../../../middleware/auth';
import { Hono } from 'hono';
import { createProxiedResponse, getElectricShapeUrl } from './_helpers';
import proxyRouter from './_proxyRouterConfig';
import { getUserIdFromContext } from '../../../utils/users';
import { errorResponse } from '../../../utils/response';

const app = new Hono();

app.use('*', requireAuth);

// GET route for Electric SQL proxy
app.get('/', async (c) => {
  const url = getElectricShapeUrl(c.req.url);
  const table = url.searchParams.get('table');
  const userId = getUserIdFromContext(c);

  if (!table) {
    return c.json({ error: 'Table is required' }, 400);
  }

  const proxy = proxyRouter[table as keyof typeof proxyRouter];

  if (!proxy) {
    return c.json(
      {
        error: `The requested table '${table}' is not available for Electric Shape processing. Please check the table name and try again.`
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
