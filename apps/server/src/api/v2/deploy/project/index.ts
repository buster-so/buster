import { deploy } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../../middleware/auth';
import { standardErrorHandler } from '../../../../utils/response';
import { deployProjectHandler } from './POST';

const app = new Hono()
  .use('*', requireAuth)

  // POST /deploy/project - Deploy models and docs
  .post('/', zValidator('json', deploy.ModelsDocsDeployRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response = await deployProjectHandler(request, user);
    return c.json(response);
  })

  .onError(standardErrorHandler);

export default app;

