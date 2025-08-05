import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import GET from './GET';
import individualReport from './[id]';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', GET)
  .route('/:id', individualReport)
  .onError(standardErrorHandler);

export default app;
