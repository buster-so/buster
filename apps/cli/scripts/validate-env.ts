#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for the CLI app
const requiredEnv = {
  // NODE_ENV is optional - will default to 'development' if not set
  // Add any CLI-specific required environment variables here:
  // API_URL: process.env.API_URL,
  // AUTH_TOKEN: process.env.AUTH_TOKEN,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
