import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import DELETE from './DELETE';
import GET from './GET';
import POST from './POST';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', GET)
  .route('/', POST)
  .route('/', DELETE)
  .onError(standardErrorHandler);

export default app;
