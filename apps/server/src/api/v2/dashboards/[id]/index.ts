import { Hono } from 'hono';
import '../../../../types/hono.types';
import DELETE from './DELETE';
import dashboardByIdRoutes from './GET';
import PUT from './PUT';
import SCREENSHOT from './screenshot';
import SHARING from './sharing';

const app = new Hono()
  .route('/', dashboardByIdRoutes)
  .route('/', PUT)
  .route('/', DELETE)
  .route('/sharing', SHARING)
  .route('/screenshot', SCREENSHOT);

export default app;
