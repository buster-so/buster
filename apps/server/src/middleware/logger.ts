import { pinoLogger } from 'hono-pino';
import 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';

let isPinoPrettyAvailable = true;

// Create logger with fallback for pino-pretty failures
function createLogger() {
  console.log('in logger middleware NODE_ENV', process.env.NODE_ENV);
  // Try pino-pretty in development
  if (isDev && isPinoPrettyAvailable) {
    try {
      return pinoLogger({
        pino: {
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: { colorize: true },
          },
        },
      });
    } catch (error) {
      console.error('pino-pretty not available, falling back to JSON logging', error);
      isPinoPrettyAvailable = false;
    }
  }

  // Fallback to simple JSON logging
  return pinoLogger({
    pino: {
      level: isDev ? 'info' : 'debug',
    },
  });
}

export const loggerMiddleware = createLogger();
