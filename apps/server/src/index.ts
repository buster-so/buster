// Preload secrets before any other imports that might use them
import { preloadSecrets } from '@buster/secrets';

await (async () => {
  try {
    console.info('🔑 Preloading secrets from Infisical...');
    await preloadSecrets();
    console.info('✅ Secrets preloaded successfully');

    // Verify critical secrets
    const criticalSecrets = ['DATABASE_URL'];
    for (const secret of criticalSecrets) {
      if (!process.env[secret]) {
        console.warn(`⚠️  Warning: ${secret} is not set after preload`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not preload secrets from Infisical:', error);
    console.info('📝 Using environment variables from .env file');
  }
})();

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

// Get port from environment or default to 3002
const port = process.env.SERVER_PORT ? Number.parseInt(process.env.SERVER_PORT, 10) : 3002;

// Export for Bun
export default {
  port,
  hostname: '0.0.0.0', // Bind to all interfaces for Docker
  fetch: app.fetch,
};
export type AppType = typeof routes;
