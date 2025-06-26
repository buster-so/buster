import { cors } from 'hono/cors';

const isDev = process.env.NODE_ENV === 'development';

export const corsMiddleware = cors({
  origin: isDev
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : (origin) => {
        if (!origin) return undefined;
        return origin.endsWith('.buster.so') || origin === 'https://buster.so' ? origin : undefined;
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
