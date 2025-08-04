import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import { z } from 'zod';
import { ConfigError, FileSystemError } from './errors.js';

// Configuration schemas
export const GlobalConfigSchema = z.object({
  version: z.string(),
  defaultEnvironment: z.enum(['local', 'cloud']).default('cloud'),
  telemetry: z.boolean().default(true),
  autoUpdate: z.boolean().default(true),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

export const CredentialsSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string(),
  environment: z.enum(['local', 'cloud']),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private credentialsPath: string;

  constructor() {
    this.configDir = process.env.BUSTER_CONFIG_DIR || path.join(os.homedir(), '.buster');
    this.configPath = path.join(this.configDir, 'config.yml');
    this.credentialsPath = path.join(this.configDir, 'credentials');
  }

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      throw new FileSystemError('Failed to create config directory');
    }
  }

  async loadGlobalConfig(): Promise<GlobalConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const parsed = yaml.load(content);
      return GlobalConfigSchema.parse(parsed);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Return defaults if config doesn't exist
        return GlobalConfigSchema.parse({});
      }
      throw new ConfigError('Failed to load configuration');
    }
  }

  async saveGlobalConfig(config: GlobalConfig): Promise<void> {
    await this.ensureConfigDir();
    const yamlContent = yaml.dump(config);
    await fs.writeFile(this.configPath, yamlContent, 'utf-8');
  }

  async loadCredentials(): Promise<Credentials | null> {
    try {
      const content = await fs.readFile(this.credentialsPath, 'utf-8');
      const parsed = JSON.parse(content);
      return CredentialsSchema.parse(parsed);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new ConfigError('Failed to load credentials');
    }
  }

  async saveCredentials(credentials: Credentials): Promise<void> {
    await this.ensureConfigDir();
    // TODO: Encrypt credentials before saving
    const jsonContent = JSON.stringify(credentials, null, 2);
    await fs.writeFile(this.credentialsPath, jsonContent, 'utf-8');
    // Set restrictive permissions
    await fs.chmod(this.credentialsPath, 0o600);
  }

  async clearCredentials(): Promise<void> {
    try {
      await fs.unlink(this.credentialsPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new ConfigError('Failed to clear credentials');
      }
    }
  }
}

// Singleton instance
export const configManager = new ConfigManager();