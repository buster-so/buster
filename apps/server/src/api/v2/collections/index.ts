import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { standardErrorHandler } from '../../../utils/response';
import collectionByIdRoutes from './[id]';
import GET from './GET';

const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', requireAuth)
  .route('/', GET)
  .route('/:id', collectionByIdRoutes)
  .onError(standardErrorHandler);

export default app;
