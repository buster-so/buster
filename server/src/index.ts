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
app.route('/healthcheck', healthcheckRoutes);
app.route('/api/v2', v2Routes);

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

// Get port from environment variable or default to 3002 (as mentioned in README)
const port = Number.parseInt(process.env.PORT || '3002', 10);

console.log(`🚀 Buster API Server starting on port ${port}`);
console.log(`🏥 Detailed health check available at http://localhost:${port}/healthcheck`);

// Export for Bun
export default {
  port,
  fetch: app.fetch,
};
