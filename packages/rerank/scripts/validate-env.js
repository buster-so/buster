#!/usr/bin/env node

// Build-time environment validation

console.log('🔍 Validating environment variables...');

const env = {
  RERANK_API_KEY: process.env.RERANK_API_KEY,
  RERANK_MODEL: process.env.RERANK_MODEL,
  RERANK_BASE_URL: process.env.RERANK_BASE_URL,
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
