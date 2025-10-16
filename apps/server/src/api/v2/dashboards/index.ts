import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { standardErrorHandler } from '../../../utils/response';
import POST from './POST';
import dashboardByIdRoutes from './[id]';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)
  .route('/', POST)
  .route('/:id', dashboardByIdRoutes)
  .onError(standardErrorHandler);

export default app;
