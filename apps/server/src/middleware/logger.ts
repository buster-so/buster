import { pinoLogger } from 'hono-pino';
import pino from 'pino';
import { getSecretSync } from '@buster/secrets';

const getEnvValue = (key: string, defaultValue?: string): string | undefined => {
  try {
    return getSecretSync(key);
  } catch {
    return defaultValue;
  }
};

const isDev = getEnvValue('NODE_ENV', 'development') !== 'production';
const logLevel = getEnvValue('LOG_LEVEL', 'info') || 'info';
let isPinoPrettyAvailable = true;

// Create base pino instance
const createBaseLogger = () => {
  if (isDev && isPinoPrettyAvailable) {
    try {
      // Only use pino-pretty transport in development
      return pino({
        level: logLevel,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      });
    } catch (error) {
      console.warn('pino-pretty not available, falling back to JSON logging');
      console.error(error);
      isPinoPrettyAvailable = false;
    }
  }

  // Production or fallback: use standard JSON logging
  return pino({
    level: logLevel,
  });
};

const baseLogger = createBaseLogger();

// Simple console capture - only override if LOG_LEVEL is set
if (getEnvValue('LOG_LEVEL')) {
  console.info = (first, ...args) => {
    if (typeof first === 'string' && args.length > 0 && typeof args[0] === 'object') {
      // Handle pattern: console.info('message', { data })
      baseLogger.info(args[0], first);
    } else if (typeof first === 'string') {
      // Handle pattern: console.info('message')
      baseLogger.info(first);
    } else {
      // Handle pattern: console.info({ data })
      baseLogger.info({ data: first }, ...args);
    }
  };
  console.warn = (first, ...args) => {
    if (typeof first === 'string' && args.length > 0 && typeof args[0] === 'object') {
      // Handle pattern: console.warn('message', { data })
      baseLogger.warn(args[0], first);
    } else if (typeof first === 'string') {
      // Handle pattern: console.warn('message')
      baseLogger.warn(first);
    } else {
      // Handle pattern: console.warn({ data })
      baseLogger.warn({ data: first }, ...args);
    }
  };
  console.error = (first, ...args) => {
    if (typeof first === 'string' && args.length > 0 && typeof args[0] === 'object') {
      // Handle pattern: console.error('message', { data })
      baseLogger.error(args[0], first);
    } else if (typeof first === 'string') {
      // Handle pattern: console.error('message')
      baseLogger.error(first);
    } else {
      // Handle pattern: console.error({ data })
      baseLogger.error({ data: first }, ...args);
    }
  };

  // Suppress debug logs when LOG_LEVEL is info or higher
  if (logLevel !== 'debug' && logLevel !== 'trace') {
    console.debug = () => {};
  }
}

// Create logger middleware
export const loggerMiddleware = pinoLogger({
  pino: baseLogger,
  http: false, // Disable automatic HTTP request logging
});
