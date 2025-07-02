import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import chatsRoutes from './chats';
import currencyRoutes from './currency';
import electricShapeRoutes from './electric-shape';
import slackRoutes from './slack';
import supportRoutes from './support';
import userRoutes from './users';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes)
  .route('/slack', slackRoutes)
  .route('/currency', currencyRoutes)
  .route('/support', supportRoutes);

export default app;
