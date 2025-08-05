import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import chatsRoutes from './chats';
import dictionariesRoutes from './dictionaries';
import electricShapeRoutes from './electric-shape';
import organizationRoutes from './organization';
import reportsRoutes from './reports';
import securityRoutes from './security';
import slackRoutes from './slack';
import supportRoutes from './support';
import tempRoutes from './temp';
import titleRoutes from './title';
import userRoutes from './users';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes)
  .route('/slack', slackRoutes)
  .route('/support', supportRoutes)
  .route('/security', securityRoutes)
  .route('/organizations', organizationRoutes)
  .route('/dictionaries', dictionariesRoutes)
  .route('/title', titleRoutes)
  .route('/temp', tempRoutes)
  .route('/reports', reportsRoutes);

export default app;
