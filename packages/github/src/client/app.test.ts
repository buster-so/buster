import { App } from 'octokit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGitHubApp, getGitHubAppCredentials } from './app';

// Mock the octokit module
vi.mock('octokit', () => ({
  App: vi.fn(),
}));

describe('github-app', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getGitHubAppCredentials', () => {
    it('should return credentials when all environment variables are set', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64');
      process.env.GITHUB_WEBHOOK_SECRET = 'webhook-secret';

      // Act
      const credentials = getGitHubAppCredentials();

      // Assert
      expect(credentials).toEqual({
        appId: 123456,
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----',
        webhookSecret: 'webhook-secret',
      });
    });

    it('should throw error when GITHUB_APP_ID is missing', () => {
      // Arrange
      delete process.env.GITHUB_APP_ID;
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = 'test';
      process.env.GITHUB_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'GITHUB_APP_ID environment variable is not set'
      );
    });

    it('should throw error when GITHUB_APP_PRIVATE_KEY_BASE64 is missing', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      delete process.env.GITHUB_APP_PRIVATE_KEY_BASE64;
      process.env.GITHUB_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'GITHUB_APP_PRIVATE_KEY_BASE64 environment variable is not set'
      );
    });

    it('should throw error when GITHUB_WEBHOOK_SECRET is missing', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = 'test';
      delete process.env.GITHUB_WEBHOOK_SECRET;

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'GITHUB_WEBHOOK_SECRET environment variable is not set'
      );
    });

    it('should throw error when private key base64 is invalid', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = 'not-valid-base64!@#$%';
      process.env.GITHUB_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'Failed to decode GITHUB_APP_PRIVATE_KEY_BASE64: Invalid base64 encoding'
      );
    });

    it('should throw error when private key format is invalid', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 =
        Buffer.from('not-a-private-key').toString('base64');
      process.env.GITHUB_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'Invalid GitHub App private key format. Expected PEM-encoded private key'
      );
    });
  });

  describe('createGitHubApp', () => {
    it('should create GitHub App with valid credentials', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64');
      process.env.GITHUB_WEBHOOK_SECRET = 'webhook-secret';

      const mockApp = { octokit: {} };
      (App as any).mockImplementation(() => mockApp);

      // Act
      const app = createGitHubApp();

      // Assert
      expect(App).toHaveBeenCalledWith({
        appId: 123456,
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----',
        webhooks: {
          secret: 'webhook-secret',
        },
      });
      expect(app).toBe(mockApp);
    });

    it('should throw error when App creation fails', () => {
      // Arrange
      process.env.GITHUB_APP_ID = '123456';
      process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64');
      process.env.GITHUB_WEBHOOK_SECRET = 'webhook-secret';

      (App as any).mockImplementation(() => {
        throw new Error('Failed to create app');
      });

      // Act & Assert
      expect(() => createGitHubApp()).toThrow('Failed to create GitHub App: Failed to create app');
    });
  });
});
