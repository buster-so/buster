import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import individualReport from './[id]';
import GET from './GET';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', GET)
  .route('/:id', individualReport)
  .onError(standardErrorHandler);

export default app;
