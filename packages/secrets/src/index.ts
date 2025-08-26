import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InfisicalSDK } from '@infisical/sdk';
import { config } from 'dotenv';

// Export all key constants
export { AI_KEYS } from './keys/ai';
export { DATABASE_KEYS } from './keys/database';
export { DATA_SOURCE_KEYS } from './keys/data-source';
export { GITHUB_KEYS } from './keys/github';
export { SANDBOX_KEYS } from './keys/sandbox';
export { SERVER_KEYS } from './keys/server';
export { SHARED_KEYS } from './keys/shared';
export { SLACK_KEYS } from './keys/slack';
export { TRIGGER_KEYS } from './keys/trigger';
export { WEB_TOOLS_KEYS } from './keys/web-tools';
export { ELECTRIC_KEYS } from './keys/electric';
export { BRAINTRUST_KEYS } from './keys/braintrust';

// Export types
export type { AIKeys } from './keys/ai';
export type { DatabaseKeys } from './keys/database';
export type { DataSourceKeys } from './keys/data-source';
export type { GitHubKeys } from './keys/github';
export type { SandboxKeys } from './keys/sandbox';
export type { ServerKeys } from './keys/server';
export type { SharedKeys } from './keys/shared';
export type { SlackKeys } from './keys/slack';
export type { TriggerKeys } from './keys/trigger';
export type { WebToolsKeys } from './keys/web-tools';
export type { ElectricKeys } from './keys/electric';
export type { BraintrustKeys } from './keys/braintrust';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the root of the monorepo (where turbo.json is)
function findMonorepoRoot(): string {
  let currentDir = __dirname;
  while (currentDir !== '/') {
    if (existsSync(path.join(currentDir, 'turbo.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find monorepo root (turbo.json)');
}

// Load .env file if it exists
function loadEnvFile(): void {
  try {
    const rootDir = findMonorepoRoot();
    const envPath = path.join(rootDir, '.env');
    if (existsSync(envPath)) {
      config({ path: envPath });
    }
  } catch (_error) {
    // If we can't find monorepo root, try current directory
    config();
  }
}

// Initialize on module load to ensure .env is loaded
loadEnvFile();

interface SecretManagerOptions {
  environment?: string;
  projectId?: string;
  clientId?: string;
  clientSecret?: string;
  siteUrl?: string;
}

class SecretManager {
  private static instance: SecretManager;
  private client: InfisicalSDK | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private options: SecretManagerOptions;

  protected constructor(options: SecretManagerOptions = {}) {
    this.options = {
      environment:
        options.environment /* `process.env` is a Node.js global object that provides
      access to the environment variables of the current
      process. Environment variables are key-value pairs that
      can be set outside of the application and are accessible
      within the application. In the provided code,
      `process.env` is used to access environment variables like
      `INIFISICAL_ENVIRONMENT`, `INIFISICAL_PROJECT_ID`,
      `INIFISICAL_CLIENT_ID`, `INIFISICAL_CLIENT_SECRET`, and
      `INIFISICAL_SITE_URL` to configure the `SecretManager`
      instance. These environment variables are used to store
      sensitive information or configuration settings that can
      vary between different environments without hardcoding
      them in the code. */ ||
        process.env.INFISICAL_ENVIRONMENT ||
        'development',
      projectId: options.projectId || process.env.INFISICAL_PROJECT_ID,
      clientId: options.clientId || process.env.INFISICAL_CLIENT_ID,
      clientSecret: options.clientSecret || process.env.INFISICAL_CLIENT_SECRET,
      siteUrl: options.siteUrl || process.env.INFISICAL_SITE_URL,
    } as SecretManagerOptions;
  }

  static getInstance(options?: SecretManagerOptions): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager(options);
    }
    return SecretManager.instance;
  }

  private async initInfisical(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.initialized) {
      return;
    }

    // Start initialization
    this.initPromise = this.doInit();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async doInit(): Promise<void> {
    const { clientId, clientSecret, projectId, siteUrl } = this.options;

    // Only initialize Infisical if credentials are present
    if (!clientId || !clientSecret || !projectId) {
      this.initialized = true;
      return;
    }

    try {
      // Initialize SDK with optional site URL
      const sdkOptions: { siteUrl?: string } = {};
      if (siteUrl) {
        sdkOptions.siteUrl = siteUrl;
      }

      this.client = new InfisicalSDK(sdkOptions);

      // Authenticate with Infisical
      await this.client.auth().universalAuth.login({
        clientId,
        clientSecret,
      });

      console.info('✅ Infisical connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Infisical:', error);
      console.info('⚠️  Falling back to environment variables only.');
    }

    this.initialized = true;
  }

  async getSecret(key: string): Promise<string> {
    // Priority 1: Check process.env (includes .env file values)
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    // Priority 2: Fetch from Infisical in real-time
    await this.initInfisical();

    if (this.client && this.options.projectId) {
      try {
        const response = await this.client.secrets().getSecret({
          environment: this.options.environment || 'development',
          projectId: this.options.projectId,
          secretName: key,
        });

        if (response?.secretValue) {
          return response.secretValue;
        }
      } catch (_error) {
        // Secret not found in Infisical, continue to error
      }
    }

    // Secret not found anywhere
    throw new Error(
      `Secret "${key}" not found in environment variables or Infisical. Please ensure it's set in your .env file or Infisical project.`
    );
  }

  // Synchronous variant: checks only environment variables
  getSecretSync(key: string): string {
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    throw new Error(
      `Secret "${key}" not found in environment variables. Use async getSecret to fetch from Infisical or set it in your .env.`
    );
  }

  // Preload is now a no-op since we fetch in real-time
  async preloadSecrets(): Promise<void> {
    await this.initInfisical();
  }

  // Get all available secret keys (for debugging)
  getAvailableKeys(): string[] {
    return Object.keys(process.env).sort();
  }
}

// Export singleton instance methods
const defaultManager = SecretManager.getInstance();

export async function getSecret(key: string): Promise<string> {
  return defaultManager.getSecret(key);
}

export function getSecretSync(key: string): string {
  return defaultManager.getSecretSync(key);
}

export async function preloadSecrets(): Promise<void> {
  return defaultManager.preloadSecrets();
}

// Export for testing purposes
export function createSecretManager(options?: SecretManagerOptions): {
  getSecret: (key: string) => Promise<string>;
  getSecretSync: (key: string) => string;
  preloadSecrets: () => Promise<void>;
  getAvailableKeys: () => string[];
} {
  // Create a new instance with a factory method
  class TestSecretManager extends SecretManager {
    static createForTesting(opts?: SecretManagerOptions): TestSecretManager {
      return new TestSecretManager(opts);
    }
  }

  const manager = TestSecretManager.createForTesting(options);

  return {
    getSecret: (key: string) => manager.getSecret(key),
    getSecretSync: (key: string) => manager.getSecretSync(key),
    preloadSecrets: () => manager.preloadSecrets(),
    getAvailableKeys: () => manager.getAvailableKeys(),
  };
}
