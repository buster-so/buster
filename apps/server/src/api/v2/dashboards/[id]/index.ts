import { Hono } from 'hono';
import '../../../../types/hono.types';
import dashboardByIdRoutes from './GET';
import SCREENSHOT from './screenshot';
import SHARING from './sharing';

const app = new Hono()
  //  /dashboards/:id GET
  .route('/', dashboardByIdRoutes)
  .route('/sharing', SHARING)
  .route('/screenshot', SCREENSHOT);

export default app;
