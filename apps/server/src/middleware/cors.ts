import { cors } from 'hono/cors';

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

export const corsMiddleware = cors({
  origin: isDev
    ? (origin) => {
        if (!origin) {
          console.log('CORS: No origin header provided');
          return undefined;
        }

        console.log('CORS: Allowed - origin', origin);

        return origin;
      }
    : (origin) => {
        if (!origin) {
          console.log('CORS: No origin header provided');
          return undefined;
        }

        try {
          const url = new URL(origin);
          const hostname = url.hostname;

          console.log(
            `CORS: Checking origin ${origin} with hostname ${hostname}, NODE_ENV: ${process.env.NODE_ENV}`
          );

          // Define allowed domains based on environment
          const allowedDomains = [
            'buster.so',
            'staging.buster.so',
            'preview.buster.so',
            'www.buster.so',
          ];

          // For non-production, also allow any subdomain
          if (!isProd) {
            // Allow any subdomain of buster.so for staging/dev environments
            if (hostname.endsWith('.buster.so')) {
              console.log('CORS: Allowed - subdomain of buster.so (non-prod)');
              return origin;
            }
          }

          // Check against allowed domains
          if (allowedDomains.includes(hostname)) {
            console.log(`CORS: Allowed - ${hostname} is in allowed domains`);
            return origin;
          }

          console.log(
            `CORS: Blocked - ${hostname} does not match allowed patterns. Allowed: ${allowedDomains.join(', ')}`
          );
          return undefined;
        } catch (error) {
          // Invalid URL format
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
