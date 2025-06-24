// Validate required environment variables
for (const envVar of Object.values({
  BRAINTRUST_KEY: 'BRAINTRUST_KEY',
  PATH: 'PATH',
  HOME: 'HOME',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  ENVIRONMENT: 'ENVIRONMENT',
  DATABASE_URL: 'DATABASE_URL',
} as const)) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
}

export const env = {
  BRAINTRUST_KEY: process.env.BRAINTRUST_KEY as string,
  PATH: process.env.PATH as string,
  HOME: process.env.HOME as string,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY as string,
  ENVIRONMENT: process.env.ENVIRONMENT as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
