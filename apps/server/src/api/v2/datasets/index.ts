import { db } from '@buster/database/connection';
import {
  getOrganizationDatasets,
  getUserOrganizationsByUserId,
  type User,
} from '@buster/database/queries';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { datasetById } from './[id]';

// Create Hono app for datasets routes
const app = new Hono<{
  Variables: {
    busterUser: User;
  };
}>()
  // Apply authentication middleware to all routes
  .use('*', requireAuth);

// Get organization datasets endpoint
app.get('/', async (c) => {
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

// Mount dataset by ID routes at /:id
app.route('/:id', datasetById);

export default app;
