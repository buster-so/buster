#!/usr/bin/env node

// Build-time environment validation

console.log('🔍 Validating environment variables...');

// Skip validation during Docker builds (environment variables are only available at runtime)
if (process.env.DOCKER_BUILD || process.env.CI || process.env.NODE_ENV === 'production') {
  console.log(
    '🐳 Docker/CI build detected - skipping environment validation (will validate at runtime)'
  );
  process.exit(0);
}

const env = {
  SERVER_PORT: process.env.SERVER_PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ELECTRIC_PROXY_URL: process.env.ELECTRIC_PROXY_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
};

// Optional Slack OAuth environment variables
const slackEnv = {
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
  SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,
  SLACK_INTEGRATION_ENABLED: process.env.SLACK_INTEGRATION_ENABLED || 'false',
  SLACK_APP_SUPPORT_URL: process.env.SLACK_APP_SUPPORT_URL,
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

// Check Slack variables only if integration is enabled
if (slackEnv.SLACK_INTEGRATION_ENABLED === 'true') {
  console.log('');
  console.log('🔍 Slack integration is enabled. Validating Slack environment variables...');

  const requiredSlackVars = [
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'SLACK_REDIRECT_URI',
    'SLACK_APP_SUPPORT_URL',
  ];

  for (const envKey of requiredSlackVars) {
    if (!slackEnv[envKey]) {
      console.error(`❌ Missing required Slack environment variable: ${envKey}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${envKey} is set`);
    }
  }
} else {
  console.log('ℹ️  Slack integration is disabled (SLACK_INTEGRATION_ENABLED != true)');
}

if (hasErrors) {
  console.error('');
  console.error('❌ Build cannot continue with missing environment variables.');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('✅ All required environment variables are present');
