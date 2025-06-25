#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// Build-time environment validation

console.info('🔍 Validating environment variables...');

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Add your required environment variables here
  // DATABASE_URL: process.env.DATABASE_URL,
  // API_KEY: process.env.API_KEY,
};

let hasErrors = false;

for (const [envKey, value] of Object.entries(env)) {
  if (!value) {
    console.error(`❌ Missing required environment variable: ${envKey}`);
    hasErrors = true;
  } else {
    console.info(`✅ ${envKey} is set`);
  }
}

if (hasErrors) {
  console.error('');
  console.error('❌ Build cannot continue with missing environment variables.');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.info('✅ All required environment variables are present');
