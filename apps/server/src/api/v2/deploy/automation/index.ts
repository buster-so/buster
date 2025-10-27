import { deploy } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../../middleware/auth';
import { standardErrorHandler } from '../../../../utils/response';
import { deployAutomationHandler } from './POST';

const app = new Hono()
  .use('*', requireAuth)

  // POST /deploy/automation - Deploy automation configuration
  .post('/', zValidator('json', deploy.AutomationDeployRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response = await deployAutomationHandler(request, user);
    return c.json(response);
  })

  .onError(standardErrorHandler);

export default app;

