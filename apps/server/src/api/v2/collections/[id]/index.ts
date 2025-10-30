import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../utils/response';
import GET from './GET';

const app = new Hono()
  .route('/', GET)
  .onError(standardErrorHandler);

export default app;

