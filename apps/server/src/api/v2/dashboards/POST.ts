import { PostDashboardRequestSchema } from '@buster/server-shared/dashboards';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';

const app = new Hono()
  .use(requireAuth)

  .post('/', zValidator('json', PostDashboardRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response = await createDashboardHandler(request, user);

    return c.json({ message: 'Hello, world!' });
  })
  .onError(standardErrorHandler);

export default app;
