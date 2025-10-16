import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { standardErrorHandler } from '../../../utils/response';
import DELETE from './DELETE';
import GET from './GET';
import POST from './POST';
import dashboardByIdRoutes from './[id]';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)
  .route('/', GET)
  .route('/', POST)
  .route('/', DELETE)
  .route('/:id', dashboardByIdRoutes)
  .onError(standardErrorHandler);

export default app;
