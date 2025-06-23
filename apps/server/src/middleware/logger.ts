import { pinoLogger } from 'hono-pino';

const isDev = process.env.NODE_ENV !== 'production';

const loggerConfig: NonNullable<Parameters<typeof pinoLogger>[0]>['pino'] = isDev
  ? {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    }
  : { level: 'debug' };

export const loggerMiddleware = pinoLogger({ pino: loggerConfig });
