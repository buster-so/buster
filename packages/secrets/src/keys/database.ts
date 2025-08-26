/**
 * Secret keys used by the @buster/database package
 */

export const DATABASE_KEYS = {
  DATABASE_URL: 'DATABASE_URL',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',
} as const;

export type DatabaseKeys = (typeof DATABASE_KEYS)[keyof typeof DATABASE_KEYS];
