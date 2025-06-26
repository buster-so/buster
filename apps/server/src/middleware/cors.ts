import { cors } from 'hono/cors';

const isDev = process.env.NODE_ENV === 'development';

export const corsMiddleware = cors({
  origin: isDev
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : (origin) => {
        if (!origin) return undefined;

        try {
          const url = new URL(origin);
          const hostname = url.hostname;

          // Allow exact match for main domain
          if (hostname === 'buster.so') return origin;

          // Allow subdomains of buster.so
          if (hostname.endsWith('.buster.so')) return origin;

          return undefined;
        } catch {
          // Invalid URL format
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
