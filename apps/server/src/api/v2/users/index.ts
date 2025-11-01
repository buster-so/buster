import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import userIdEndpoints from './[id]';
import favorites from './favorites';
import GET from './GET';
import POST from './POST';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  // Mount the modular routes
  .route('/', GET)
  .route('/', POST)
  .route('/favorites', favorites)
  .route('/:id', userIdEndpoints);

export default app;
