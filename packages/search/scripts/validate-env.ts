#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
  // NODE_ENV is optional - will default to 'development' if not set
  // TURBOPUFFER_API_KEY is optional for development, required for production
  TURBOPUFFER_API_KEY: process.env.TURBOPUFFER_API_KEY,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
