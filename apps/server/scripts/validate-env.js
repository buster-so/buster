#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// Build-time environment validation

console.log('🔍 Validating environment variables...');

const env = {
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ELECTRIC_PROXY_URL: process.env.ELECTRIC_PROXY_URL,
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
