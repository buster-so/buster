// Validate required environment variables
for (const envVar of Object.values({
  DATABASE_URL: 'DATABASE_URL',
} as const)) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
