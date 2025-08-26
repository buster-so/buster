import { getSecret } from '@buster/secrets';
import type { Context, Next } from 'hono';
import { pinoLogger } from 'hono-pino';
import pino from 'pino';

const getEnvValue = async (key: string, defaultValue?: string): Promise<string | undefined> => {
  try {
    return await getSecret(key);
  } catch {
    return defaultValue;
  }
};

// Initialize async values
let isDev: boolean;
let logLevel: string;
let isInitialized = false;

const initializeLogger = async (): Promise<void> => {
  if (isInitialized) return;

  const nodeEnv = await getEnvValue('NODE_ENV', 'development');
  isDev = nodeEnv !== 'production';
  logLevel = (await getEnvValue('LOG_LEVEL', 'info')) || 'info';

  isInitialized = true;
};
let isPinoPrettyAvailable = true;

// Create base pino instance
const createBaseLogger = async (): Promise<pino.Logger> => {
  await initializeLogger();

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

const baseLoggerPromise = createBaseLogger();

// Async initialization of console overrides
const initializeConsoleOverrides = async (): Promise<void> => {
  await initializeLogger();
  const hasLogLevel = await getEnvValue('LOG_LEVEL');

  if (hasLogLevel) {
    const baseLogger = await baseLoggerPromise;
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
};

// Initialize console overrides
initializeConsoleOverrides();

// Create async logger middleware
export const createLoggerMiddleware = async () => {
  const baseLogger = await baseLoggerPromise;
  return pinoLogger({
    pino: baseLogger,
    http: false, // Disable automatic HTTP request logging
  });
};

// Cache the middleware promise to avoid recreating it on every request
let cachedMiddleware: ReturnType<typeof pinoLogger> | null = null;

// Export middleware that handles async initialization
export const loggerMiddleware = async (c: Context, next: Next) => {
  if (!cachedMiddleware) {
    cachedMiddleware = await createLoggerMiddleware();
  }
  return cachedMiddleware(c, next);
};
