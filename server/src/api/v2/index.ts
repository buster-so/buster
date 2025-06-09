import { Hono } from 'hono';

// Import feature-specific routes
import userRoutes from './users';
import electricShapeRoutes from './electric-shape';

const app = new Hono().route('/users', userRoutes).route('/electric-shape', electricShapeRoutes);

// TODO: Add more feature routes as they are created
// import datasetRoutes from './datasets';
// app.route('/datasets', datasetRoutes);

export default app;
