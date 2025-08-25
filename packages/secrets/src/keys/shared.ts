/**
 * Shared secret keys used across multiple packages
 * These are common secrets that many packages need access to
 */

export const SHARED_KEYS = {
  // Environment Configuration
  NODE_ENV: 'NODE_ENV',
  ENVIRONMENT: 'ENVIRONMENT',

  // Database (used by multiple packages)
  DATABASE_URL: 'DATABASE_URL',

  // Supabase (used by multiple packages)
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',

  // Monitoring & Logging
  LOG_LEVEL: 'LOG_LEVEL',

  // CI/CD
  CI: 'CI',
} as const;

export type SharedKeys = (typeof SHARED_KEYS)[keyof typeof SHARED_KEYS];
