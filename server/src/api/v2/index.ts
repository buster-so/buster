import { Hono } from 'hono';

// Import feature-specific routes
import userRoutes from './user';

const app = new Hono();

console.log('Setting up v2 API routes...');

app.get('/', (c) => {
  console.log('v2 root route hit');
  return c.json({
    message: 'Buster API v2',
    endpoints: ['/api/v2/healthcheck', '/api/v2/user', '/api/v2/datasets']
  });
});

// Mount feature-specific routes
console.log('Mounting user routes...');
app.route('/user', userRoutes);

console.log('v2 API setup complete');

// TODO: Add more feature routes as they are created
// import datasetRoutes from './datasets';
// app.route('/datasets', datasetRoutes);

export default app;
