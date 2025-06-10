import { logger } from 'hono/logger';

export const loggerMiddleware = logger((str, ...rest) => {
  // Custom logging format for development
  if (process.env.NODE_ENV === 'development') {
    console.log(str, ...rest);
  } else {
    // In production, you might want to use a proper logging service
    console.log(str, ...rest);
  }
});
