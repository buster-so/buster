import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../utils/response';
import assetsRoutes from './assets';
import GET from './GET';
import PUT from './PUT';
import sharingRoutes from './sharing';

const app = new Hono()
  .route('/', GET)
  .route('/', PUT)
  .route('/assets', assetsRoutes)
  .route('/sharing', sharingRoutes)
  .onError(standardErrorHandler);

export default app;
