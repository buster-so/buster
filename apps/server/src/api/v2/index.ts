import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import chatsRoutes from './chats';
import dictionariesRoutes from './dictionaries';
import electricShapeRoutes from './electric-shape';
import githubRoutes from './github';
import organizationRoutes from './organization';
import securityRoutes from './security';
import slackRoutes from './slack';
import supportRoutes from './support';
import userRoutes from './users';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes)
  .route('/slack', slackRoutes)
  .route('/github', githubRoutes)
  .route('/support', supportRoutes)
  .route('/security', securityRoutes)
  .route('/organizations', organizationRoutes)
  .route('/dictionaries', dictionariesRoutes);

export default app;
