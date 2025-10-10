#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
// Note: These are only required at runtime when using the GitHub integration
// Making them optional for build time to allow packages to be built without GitHub setup
const requiredEnv = {
  // GitHub App configuration (required for runtime)
  GH_APP_ID: process.env.GH_APP_ID,
  GH_APP_PRIVATE_KEY_BASE64: process.env.GH_APP_PRIVATE_KEY_BASE64,
  GH_WEBHOOK_SECRET: process.env.GH_WEBHOOK_SECRET,
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
