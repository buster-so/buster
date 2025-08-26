import { App } from 'octokit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGitHubApp, getGitHubAppCredentials } from './github-app';

// Mock @buster/secrets
vi.mock('@buster/secrets', () => ({
  getSecret: vi.fn(),
  GITHUB_KEYS: {
    GITHUB_APP_ID: 'GITHUB_APP_ID',
    GITHUB_APP_NAME: 'GITHUB_APP_NAME',
    GITHUB_APP_PRIVATE_KEY_BASE64: 'GITHUB_APP_PRIVATE_KEY_BASE64',
    GITHUB_APP_PRIVATE_KEY_BASE: 'GITHUB_APP_PRIVATE_KEY_BASE',
    GITHUB_WEBHOOK_SECRET: 'GITHUB_WEBHOOK_SECRET',
    GITHUB_TOKEN: 'GITHUB_TOKEN',
  },
}));

// Mock the octokit module
vi.mock('octokit', () => ({
  App: vi.fn(),
}));

import { getSecret } from '@buster/secrets';

describe('github-app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getGitHubAppCredentials', () => {
    it('should return credentials when all environment variables are set', async () => {
      // Arrange
      const privateKey = '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----';
      const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
      
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return privateKeyBase64;
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'webhook-secret';
        throw new Error(`Unexpected key: ${key}`);
      });

      // Act
      const credentials = await getGitHubAppCredentials();

      // Assert
      expect(credentials).toEqual({
        appId: 123456,
        privateKey: privateKey,
        webhookSecret: 'webhook-secret',
      });
    });

    it('should throw error when GITHUB_APP_ID is missing', async () => {
      // Arrange
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return 'test';
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'test';
        throw new Error(`Unexpected key: ${key}`);
      });

      // Act & Assert
      await expect(getGitHubAppCredentials()).rejects.toThrow(
        'GITHUB_APP_ID environment variable is not set'
      );
    });

    it('should throw error when GITHUB_APP_PRIVATE_KEY_BASE64 is missing', async () => {
      // Arrange
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return '';
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'test';
        throw new Error(`Unexpected key: ${key}`);
      });

      // Act & Assert
      await expect(getGitHubAppCredentials()).rejects.toThrow(
        'GITHUB_APP_PRIVATE_KEY_BASE64 environment variable is not set'
      );
    });

    it('should throw error when GITHUB_WEBHOOK_SECRET is missing', async () => {
      // Arrange
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return 'test';
        if (key === 'GITHUB_WEBHOOK_SECRET') return '';
        throw new Error(`Unexpected key: ${key}`);
      });

      // Act & Assert
      await expect(getGitHubAppCredentials()).rejects.toThrow(
        'GITHUB_WEBHOOK_SECRET environment variable is not set'
      );
    });

    it('should throw error when private key base64 is invalid', async () => {
      // Arrange
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return 'not-valid-base64!@#$%';
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'test';
        throw new Error(`Unexpected key: ${key}`);
      });

      // Act & Assert
      await expect(getGitHubAppCredentials()).rejects.toThrow(
        'Failed to decode GITHUB_APP_PRIVATE_KEY_BASE64: Invalid base64 encoding'
      );
    });

    it('should throw error when private key format is invalid', async () => {
      // Arrange
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return Buffer.from('not-a-private-key').toString('base64');
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'test';
        throw new Error(`Unexpected key: ${key}`);
      });

      // Act & Assert
      await expect(getGitHubAppCredentials()).rejects.toThrow(
        'Invalid GitHub App private key format. Expected PEM-encoded RSA private key or PKCS#8 private key'
      );
    });
  });

  describe('createGitHubApp', () => {
    it('should create GitHub App with valid credentials', async () => {
      // Arrange
      const privateKey = '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----';
      const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
      
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return privateKeyBase64;
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'webhook-secret';
        throw new Error(`Unexpected key: ${key}`);
      });

      const mockApp = { octokit: {} };
      (App as any).mockImplementation(() => mockApp);

      // Act
      const app = await createGitHubApp();

      // Assert
      expect(App).toHaveBeenCalledWith({
        appId: 123456,
        privateKey: privateKey,
      });
      expect(app).toBe(mockApp);
    });

    it('should throw error when App creation fails', async () => {
      // Arrange
      const privateKey = '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----';
      const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
      
      vi.mocked(getSecret).mockImplementation(async (key: string) => {
        if (key === 'GITHUB_APP_ID') return '123456';
        if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64') return privateKeyBase64;
        if (key === 'GITHUB_WEBHOOK_SECRET') return 'webhook-secret';
        throw new Error(`Unexpected key: ${key}`);
      });

      (App as any).mockImplementation(() => {
        throw new Error('Failed to create app');
      });

      // Act & Assert
      await expect(createGitHubApp()).rejects.toThrow('Failed to create GitHub App: Failed to create app');
    });
  });
});
