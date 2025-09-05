import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import authRoutes from './auth';
import chatsRoutes from './chats';
import datasetsRoutes from './datasets';
import dictionariesRoutes from './dictionaries';
import electricShapeRoutes from './electric-shape';
import githubRoutes from './github';
import metricFilesRoutes from './metric_files';
import organizationRoutes from './organization';
import publicRoutes from './public';
import reportsRoutes from './reports';
import s3IntegrationsRoutes from './s3-integrations';
import securityRoutes from './security';
import slackRoutes from './slack';
import supportRoutes from './support';
import titleRoutes from './title';
import userRoutes from './users';

const app = new Hono()
  .route('/auth', authRoutes)
  .route('/users', userRoutes)
  .route('/datasets', datasetsRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes)
  .route('/metric_files', metricFilesRoutes)
  .route('/github', githubRoutes)
  .route('/slack', slackRoutes)
  .route('/support', supportRoutes)
  .route('/security', securityRoutes)
  .route('/organizations', organizationRoutes)
  .route('/dictionaries', dictionariesRoutes)
  .route('/title', titleRoutes)
  .route('/reports', reportsRoutes)
  .route('/s3-integrations', s3IntegrationsRoutes)
  .route('/public', publicRoutes);

export default app;
