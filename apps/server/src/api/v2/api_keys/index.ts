import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import idRoutes from './id';
import POST from './POST';
import validateRoutes from './validate';

const app = new Hono()
  // POST /api_keys/validate - No authentication required
  .route('/', validateRoutes)

  // All other routes require authentication
  .use('*', requireAuth)
  .route('/', GET)
  .route('/', POST)
  .route('/', idRoutes);

export default app;
