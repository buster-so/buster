import { Hono } from 'hono';

// Import feature-specific routes
import userRoutes from './users';
import electricShapeRoutes from './electric-shape';
import chatRoutes from './chats';

const app = new Hono();

app.get('/healthcheck', (c) => {
  return c.json({
    success: true,
    message: 'API v2 is healthy',
    timestamp: new Date().toISOString()
  });
});

app.route('/users', userRoutes);
app.route('/electric-shape', electricShapeRoutes);
app.route('/chats', chatRoutes);

// TODO: Add more feature routes as they are created
// import datasetRoutes from './datasets';
// app.route('/datasets', datasetRoutes);

export default app;
