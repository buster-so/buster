import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import { dataSourceById } from './[id]';
import { listDataSourcesRoute } from './GET';
import { createDataSourceRoute } from './POST';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', listDataSourcesRoute)
  .route('/', createDataSourceRoute)
  .route('/:id', dataSourceById)
  .onError(standardErrorHandler);

export const dataSources = app;
