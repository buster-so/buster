import type { User } from '@buster/database/queries';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { datasetById } from './[id]';
import { listDatasetsRoute } from './GET';

// Create Hono app for datasets routes
const app = new Hono()
  .use('*', requireAuth)
  .route('/', listDatasetsRoute)
  .route('/:id', datasetById);

export default app;
