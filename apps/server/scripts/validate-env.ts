#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  SERVER_PORT: process.env.SERVER_PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ELECTRIC_PROXY_URL: process.env.ELECTRIC_PROXY_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  // Slack integration environment variables (now required)
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
  SLACK_APP_SUPPORT_URL: process.env.SLACK_APP_SUPPORT_URL,
  SERVER_URL: process.env.SERVER_URL,
  //WEB_URL
  VITE_PUBLIC_URL: process.env.VITE_PUBLIC_URL,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
