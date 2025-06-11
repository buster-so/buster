import { Hono } from 'hono';

// Import custom middleware
import { corsMiddleware } from './middleware/cors';
import { loggerMiddleware } from './middleware/logger';

import healthcheckRoutes from './api/healthcheck';
// Import API route modules
import v2Routes from './api/v2';

// Create main Hono app instance
const app = new Hono();

// Apply global middleware
app.use('*', loggerMiddleware);
app.use('*', corsMiddleware);

// Mount API routes
const routes = app.route('/healthcheck', healthcheckRoutes).route('/api/v2', v2Routes);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested resource was not found' }, 404);
});

// Get port from environment variable or defaults to 3002 for local development (as mentioned in README)
const port = Number.parseInt(process.env.SERVER_PORT || '3002', 10);

// Export for Bun
export default {
  port,
  hostname: '0.0.0.0', // Bind to all interfaces for Docker
  fetch: app.fetch,
};
export type AppType = typeof routes;
