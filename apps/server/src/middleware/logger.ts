import { pinoLogger } from 'hono-pino';

const isDev = process.env.NODE_ENV !== 'production';

// Helper function to check if pino-pretty is available
function canUsePinoPretty(): boolean {
  try {
    // In bundled/production environments, dynamic imports might not work
    // so we'll avoid pino-pretty in production regardless
    return isDev && !process.env.DOCKER_CONTAINER;
  } catch {
    return false;
  }
}

const loggerConfig: NonNullable<Parameters<typeof pinoLogger>[0]>['pino'] = canUsePinoPretty()
  ? {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    }
  : {
      level: isDev ? 'info' : 'debug',
      // Simple JSON logging for production/Docker
    };

export const loggerMiddleware = pinoLogger({ pino: loggerConfig });
