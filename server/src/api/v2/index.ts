import { Hono } from 'hono';

// Import feature-specific routes
import userRoutes from './users';
import electricShapeRoutes from './electric-shape';
import healthcheckRoutes from '../healthcheck';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/electric-shape', electricShapeRoutes)
  .route('/healthcheck', healthcheckRoutes);

// TODO: Add more feature routes as they are created
// import datasetRoutes from './datasets';
// app.route('/datasets', datasetRoutes);

export default app;
