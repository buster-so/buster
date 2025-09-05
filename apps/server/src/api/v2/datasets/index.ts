import {
  type User,
  db,
  getOrganizationDatasets,
  getUserOrganizationsByUserId,
} from '@buster/database';
import { DeployRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { deployDatasetsHandler } from './deploy/handler';

// Create Hono app for datasets routes
const app = new Hono<{
  Variables: {
    busterUser: User;
  };
}>();

// Deploy datasets endpoint
app.post('/deploy', requireAuth, zValidator('json', DeployRequestSchema), async (c) => {
  const user = c.get('busterUser');
  const request = c.req.valid('json');

  const response = await deployDatasetsHandler(request, user);
  return c.json(response);
});

// Get organization datasets endpoint
app.get('/', requireAuth, async (c) => {
  const user = c.get('busterUser');
  const dataSourceId = c.req.query('dataSourceId');

  try {
    // Get user organization
    const userOrgs = await getUserOrganizationsByUserId(user.id);
    if (!userOrgs || userOrgs.length === 0) {
      throw new HTTPException(404, { message: 'User has no organization' });
    }

    const userOrg = userOrgs[0];
    if (!userOrg) {
      throw new HTTPException(404, { message: 'User has no organization' });
    }

    const datasets = await getOrganizationDatasets(db, userOrg.organizationId, dataSourceId);
    return c.json({ datasets });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get datasets error:', error);
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Failed to get datasets',
    });
  }
});

export default app;
