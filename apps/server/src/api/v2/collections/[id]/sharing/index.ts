import { Hono } from 'hono';
import { requireAuth } from '../../../../../middleware/auth';
import DELETE from './DELETE';
import GET from './GET';
import POST from './POST';
import PUT from './PUT';

const app = new Hono()
  .use('*', requireAuth)
  .route('/', GET)
  .route('/', POST)
  .route('/', PUT)
  .route('/', DELETE);

export default app;
