import { cors } from 'hono/cors';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export const corsMiddleware = cors({
  origin: isDev
    ? (origin) => {
        return origin;
      }
    : (origin) => {
        // Handle missing or empty origin (health checks, direct API calls, etc.)
        if (!origin) {
          return undefined;
        }

        try {
          const url = new URL(origin);
          const hostname = url.hostname;

          // Define allowed domains based on environment
          const allowedDomains = [
            'buster.so',
            'staging.buster.so',
            'preview.buster.so',
            'www.buster.so',
          ];

          // Check against allowed domains
          if (allowedDomains.includes(hostname)) {
            return origin;
          }

          // biome-ignore lint/suspicious/noConsoleLog: we want to log this
          console.log(
            `CORS: Blocked - ${hostname} does not match allowed patterns. Allowed: ${allowedDomains.join(', ')}`
          );
          return undefined;
        } catch (error) {
          // Invalid URL format
          // biome-ignore lint/suspicious/noConsoleLog: we want to log this
          console.log(`CORS: Blocked - invalid URL format for origin ${origin}:`, error);
          return undefined;
        }
      },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
  ],
  credentials: true,
});
