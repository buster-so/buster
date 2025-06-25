import { Hono } from 'hono';
import { handle } from 'hono/vercel';
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
    return c.text(err.errors.map((e) => e.message).join(', '), 400);
  }

  return c.json(
    {
      error: 'Internal Server Error 😕',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested resource was not found' }, 404);
});

// Get port from environment variable or defaults to 3002 for local development
const port = Number.parseInt(process.env.SERVER_PORT || '3002', 10);

// Export for Bun
export default {
  port,
  hostname: '0.0.0.0', // Bind to all interfaces for Docker
  fetch: app.fetch,
};
export type AppType = typeof routes;

const handler = handle(app);
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
export const TRACE = handler;
export const CONNECT = handler;
export const ALL = handler;
