import { Hono } from 'hono';
import { requireAuth } from '../../../../../middleware/auth';
import GET from './GET';
import POST from './POST';

const app = new Hono()
  // Apply authentication to all routes
  .use('*', requireAuth)
  // Mount the route handlers
  .route('/', GET)
  .route('/', POST);

export default app;
