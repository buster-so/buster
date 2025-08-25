import { getSecret } from '@buster/secrets';
import { Hono } from 'hono';
import { z } from 'zod';

// Import custom middleware
import { corsMiddleware } from './middleware/cors';
import { loggerMiddleware } from './middleware/logger';

import { HTTPException } from 'hono/http-exception';
import healthcheckRoutes from './api/healthcheck';
// Import API route modules
import v2Routes from './api/v2';

export const runtime = 'nodejs';

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

  if (err instanceof HTTPException) {
    // MUST use .text(), not .json(), so callRpc can read `res.text()`
    return c.text(err.message, err.status);
  }

  if (err instanceof z.ZodError) {
    return c.json(
      {
        error: 'Validation Error',
        message: err.issues.map((issue) => issue.message).join(', '),
      },
      400
    );
  }

  return c.json(
    {
      error: 'Internal Server Error 😕',
      message: 'Something went wrong',
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested resource was not found' }, 404);
});

// Get port from secrets or defaults to 3002 for local development
const port = Number.parseInt(await getSecret('SERVER_PORT').catch(() => '3002'), 10);

// Export for Bun
export default {
  port,
  hostname: '0.0.0.0', // Bind to all interfaces for Docker
  fetch: app.fetch,
};
export type AppType = typeof routes;
