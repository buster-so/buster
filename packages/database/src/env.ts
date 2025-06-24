// Validate required environment variables
for (const envVar of Object.values({
  DATABASE_URL: 'DATABASE_URL',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',
} as const)) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  SUPABASE_URL: process.env.SUPABASE_URL as string,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY as string,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
