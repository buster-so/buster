import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the root of the monorepo (where turbo.json and pnpm-workspace.yaml are)
function findMonorepoRoot(): string {
  let currentDir = __dirname;
  while (currentDir !== '/') {
    const turboPath = path.join(currentDir, 'turbo.json');
    const pnpmWorkspacePath = path.join(currentDir, 'pnpm-workspace.yaml');
    // Look for both turbo.json AND pnpm-workspace.yaml to ensure we find the actual root
    if (existsSync(turboPath) && existsSync(pnpmWorkspacePath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find monorepo root (turbo.json + pnpm-workspace.yaml)');
}

// Load environment variables from root .env file
export function loadRootEnv(): void {
  let envPath: string;
  try {
    const rootDir = findMonorepoRoot();
    envPath = path.join(rootDir, '.env');
    if (!existsSync(envPath)) {
      // If .env does not exist in root, fallback to .env in current directory
      envPath = path.join(__dirname, '.env');
    }
  } catch {
    // If monorepo root not found, fallback to .env in current directory
    envPath = path.join(__dirname, '.env');
  }

  config({ path: envPath });
}

export interface EnvValidationResult {
  hasErrors: boolean;
  missingVariables: string[];
}

export interface EnvValidationOptions {
  skipInCI?: boolean;
  skipInProduction?: boolean;
  skipInDocker?: boolean;
  logPublicVars?: boolean;
}

// Validate required environment variables
export function validateEnv(
  requiredVars: Record<string, string | undefined>,
  options: EnvValidationOptions = {}
): EnvValidationResult {
  const {
    skipInCI = true,
    skipInProduction = true,
    logPublicVars = false,
    skipInDocker = true,
  } = options;

  console.info('🔍 Validating environment variables...');
  console.info(process.env.NODE_ENV);
  console.info(process.env.CI);

  // Skip validation in certain environments
  if (
    (skipInDocker && process.env.DOCKER_BUILD) ||
    (skipInCI && process.env.CI) ||
    (skipInProduction && process.env.NODE_ENV === 'production')
  ) {
    console.info('🐳 Docker/CI/Production build detected - skipping environment validation');
    return { hasErrors: false, missingVariables: [] };
  }

  const missingVariables: string[] = [];

  for (const [envKey, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.error(`❌ Missing required environment variable: ${envKey}`);
      missingVariables.push(envKey);
    } else {
      if (logPublicVars && envKey.includes('_PUBLIC_')) {
        console.info(`✅ ${envKey} is set with value: ${value}`);
      } else {
        console.info(`✅ ${envKey} is set`);
      }
    }
  }

  if (missingVariables.length > 0) {
    console.error('');
    console.error('❌ Build cannot continue with missing environment variables.');
    console.error(
      'Please check your .env file at the project root and ensure all required variables are set.'
    );
  } else {
    console.info('✅ All required environment variables are present');
  }

  return {
    hasErrors: missingVariables.length > 0,
    missingVariables,
  };
}

// Create a validate-env script for a package
export function createValidateEnvScript(requiredEnvVars: string[]): string {
  const envVarsObject = requiredEnvVars
    .map((varName) => `  ${varName}: process.env.${varName},`)
    .join('\n');

  return `#!/usr/bin/env node

// This script uses the shared env-utils to validate environment variables
import { loadRootEnv, validateEnv } from '@buster/env-utils';

// Load environment variables from root .env file
loadRootEnv();

// Define required environment variables for this package
const requiredEnv = {
${envVarsObject}
};

// Validate environment variables
const { hasErrors } = validateEnv(requiredEnv);

if (hasErrors) {
  process.exit(1);
}
`;
}
