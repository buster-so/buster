// Validate required environment variables
for (const envVar of Object.values({
  DATABASE_URL: 'DATABASE_URL',
  BRAINTRUST_KEY: 'BRAINTRUST_KEY',
  TRIGGER_SECRET_KEY: 'TRIGGER_SECRET_KEY',
  ENVIRONMENT: 'ENVIRONMENT',
} as const)) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  BRAINTRUST_KEY: process.env.BRAINTRUST_KEY as string,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY as string,
  ENVIRONMENT: process.env.ENVIRONMENT as string,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
