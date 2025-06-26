import { cors } from 'hono/cors';

console.log('CORS middleware init - NODE_ENV:', process.env.NODE_ENV);
console.log('CORS middleware init - All env vars:', JSON.stringify(process.env, null, 2));
const isDev = process.env.NODE_ENV === 'development';

export const corsMiddleware = cors({
  origin: isDev
    ? (origin) => {
        return origin;
      }
    : (origin) => {
        try {
          const url = new URL(origin);
          const hostname = url.hostname;
          console.log('NODE_ENV in middleware', process.env.NODE_ENV);

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
