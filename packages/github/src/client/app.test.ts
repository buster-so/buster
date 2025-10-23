/** biome-ignore-all lint/correctness/noConstructorReturn: octokit is a class-based mock */
import { App } from 'octokit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGitHubApp, getGitHubAppCredentials } from './app';

// Mock the octokit module with class-based mock
let mockAppInstance: any;
let mockAppConstructor: any;
let mockAppSpy: any;
vi.mock('octokit', () => ({
  App: class {
    constructor(...args: any[]) {
      mockAppSpy(...args);
      if (mockAppConstructor) {
        return mockAppConstructor(...args);
      }
      return mockAppInstance;
    }
  },
}));

describe('github-app', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    vi.clearAllMocks();

    // Reset mock to default
    mockAppInstance = { octokit: {} };
    mockAppConstructor = null;
    mockAppSpy = vi.fn();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getGitHubAppCredentials', () => {
    it('should return credentials when all environment variables are set', () => {
      // Arrange
      process.env.GH_APP_ID = '123456';
      process.env.GH_APP_PRIVATE_KEY_BASE64 = Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64');
      process.env.GH_WEBHOOK_SECRET = 'webhook-secret';

      // Act
      const credentials = getGitHubAppCredentials();

      // Assert
      expect(credentials).toEqual({
        appId: 123456,
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----',
        webhookSecret: 'webhook-secret',
      });
    });

    it('should throw error when GH_APP_ID is missing', () => {
      // Arrange
      delete process.env.GH_APP_ID;
      process.env.GH_APP_PRIVATE_KEY_BASE64 = 'test';
      process.env.GH_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow('GH_APP_ID environment variable is not set');
    });

    it('should throw error when GH_APP_PRIVATE_KEY_BASE64 is missing', () => {
      // Arrange
      process.env.GH_APP_ID = '123456';
      delete process.env.GH_APP_PRIVATE_KEY_BASE64;
      process.env.GH_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'GH_APP_PRIVATE_KEY_BASE64 environment variable is not set'
      );
    });

    it('should throw error when GH_WEBHOOK_SECRET is missing', () => {
      // Arrange
      process.env.GH_APP_ID = '123456';
      process.env.GH_APP_PRIVATE_KEY_BASE64 = 'test';
      delete process.env.GH_WEBHOOK_SECRET;

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'GH_WEBHOOK_SECRET environment variable is not set'
      );
    });

    it('should throw error when private key base64 is invalid', () => {
      // Arrange
      process.env.GH_APP_ID = '123456';
      process.env.GH_APP_PRIVATE_KEY_BASE64 = 'not-valid-base64!@#$%';
      process.env.GH_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'Failed to decode GH_APP_PRIVATE_KEY_BASE64: Invalid base64 encoding'
      );
    });

    it('should throw error when private key format is invalid', () => {
      // Arrange
      process.env.GH_APP_ID = '123456';
      process.env.GH_APP_PRIVATE_KEY_BASE64 = Buffer.from('not-a-private-key').toString('base64');
      process.env.GH_WEBHOOK_SECRET = 'test';

      // Act & Assert
      expect(() => getGitHubAppCredentials()).toThrow(
        'Invalid GitHub App private key format. Expected PEM-encoded private key'
      );
    });
  });

  describe('createGitHubApp', () => {
    it('should create GitHub App with valid credentials', () => {
      // Arrange
      process.env.GH_APP_ID = '123456';
      process.env.GH_APP_PRIVATE_KEY_BASE64 = Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64');
      process.env.GH_WEBHOOK_SECRET = 'webhook-secret';

      const mockApp = { octokit: {} };
      mockAppInstance = mockApp;

      // Act
      const app = createGitHubApp();

      // Assert
      expect(mockAppSpy).toHaveBeenCalledWith({
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
      process.env.GH_APP_ID = '123456';
      process.env.GH_APP_PRIVATE_KEY_BASE64 = Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64');
      process.env.GH_WEBHOOK_SECRET = 'webhook-secret';

      mockAppConstructor = () => {
        throw new Error('Failed to create app');
      };

      // Act & Assert
      expect(() => createGitHubApp()).toThrow('Failed to create GitHub App: Failed to create app');
    });
  });
});
