import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import { createDataSourceRoute } from './POST';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', createDataSourceRoute)
  .onError(standardErrorHandler);

export const dataSources = app;
