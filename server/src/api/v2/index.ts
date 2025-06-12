import { Hono } from 'hono';

import healthcheckRoutes from '../healthcheck';
import chatsRoutes from './chats';
import electricShapeRoutes from './electric-shape';
import userRoutes from './users';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes)
  .route('/chats', chatsRoutes);

// TODO: Add more feature routes as they are created
// import datasetRoutes from './datasets';
// app.route('/datasets', datasetRoutes);

export default app;
