import { logger } from 'hono/logger';

export const loggerMiddleware = logger((_str, ..._rest) => {
  // Custom logging format for development
  if (process.env.NODE_ENV === 'development') {
  } else {
  }
});
