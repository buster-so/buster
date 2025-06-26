import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import chatsRoutes from './chats';
import electricShapeRoutes from './electric-shape';
import slackRoutes from './slack';
import userRoutes from './users';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes)
  .route('/slack', slackRoutes);

export default app;
