import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import authRoutes from './auth';
import chatsRoutes from './chats';
import dashboardRoutes from './dashboards';
import datasetsRoutes from './datasets';
import deployRoutes from './deploy';
import dictionariesRoutes from './dictionaries';
import docsRoutes from './docs';
import electricShapeRoutes from './electric-shape';
import githubRoutes from './github';
import libraryRoutes from './library';
import metricFilesRoutes from './metric_files';
import organizationRoutes from './organization';
import publicRoutes from './public';
import reportsRoutes from './reports';
import s3IntegrationsRoutes from './s3-integrations';
import searchRoutes from './search';
import securityRoutes from './security';
import shortcutsRoutes from './shortcuts';
import slackRoutes from './slack';
import sqlRoutes from './sql';
import supportRoutes from './support';
import titleRoutes from './title';
import userRoutes from './users';

const app = new Hono()
  .route('/auth', authRoutes)
  .route('/users', userRoutes)
  .route('/datasets', datasetsRoutes)
  .route('/deploy', deployRoutes)
  .route('/docs', docsRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes)
  .route('/library', libraryRoutes)
  .route('/metric_files', metricFilesRoutes)
  .route('/github', githubRoutes)
  .route('/slack', slackRoutes)
  .route('/sql', sqlRoutes)
  .route('/support', supportRoutes)
  .route('/security', securityRoutes)
  .route('/shortcuts', shortcutsRoutes)
  .route('/organizations', organizationRoutes)
  .route('/dictionaries', dictionariesRoutes)
  .route('/title', titleRoutes)
  .route('/reports', reportsRoutes)
  .route('/s3-integrations', s3IntegrationsRoutes)
  .route('/search', searchRoutes)
  .route('/public', publicRoutes)
  .route('/dashboards', dashboardRoutes);

export default app;
