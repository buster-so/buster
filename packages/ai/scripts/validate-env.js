#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// Build-time environment validation

console.log('🔍 Validating environment variables...');

const env = {
  BRAINTRUST_KEY: process.env.BRAINTRUST_KEY,
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

let hasErrors = false;

for (const [envKey, value] of Object.entries(env)) {
  if (!value) {
    console.error(`❌ Missing required environment variable: ${envKey}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${envKey} is set`);
  }
}

if (hasErrors) {
  console.error('');
  console.error('❌ Build cannot continue with missing environment variables.');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('✅ All required environment variables are present');
