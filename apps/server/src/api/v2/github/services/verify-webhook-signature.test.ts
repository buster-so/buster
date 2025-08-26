import { createHmac } from 'node:crypto';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractGitHubWebhookSignature,
  verifyGitHubWebhook,
  verifyGitHubWebhookSignature,
} from './verify-webhook-signature';

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

import { getSecret } from '@buster/secrets';

describe('verify-webhook-signature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getSecret
    vi.mocked(getSecret).mockImplementation(async (key: string) => {
      if (key === 'GITHUB_APP_ID') return '123456';
      if (key === 'GITHUB_APP_PRIVATE_KEY_BASE64')
        return Buffer.from(
          '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
        ).toString('base64');
      if (key === 'GITHUB_WEBHOOK_SECRET') return 'test-webhook-secret';
      throw new Error(`Unexpected key: ${key}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyGitHubWebhookSignature', () => {
    it('should return true for valid signature', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')}`;

      // Act
      const result = await verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=invalid-signature';

      // Act
      const result = await verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when signature is missing', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });

      // Act
      const result = await verifyGitHubWebhookSignature(payload, undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when signature format is invalid', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'invalid-format-signature';

      // Act
      const result = await verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when signature has wrong algorithm', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = `sha1=${createHmac('sha1', 'test-webhook-secret').update(payload).digest('hex')}`;

      // Act
      const result = await verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle different payload types', async () => {
      // Arrange
      const payload = 'plain-text-payload';
      const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')}`;

      // Act
      const result = await verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('extractGitHubWebhookSignature', () => {
    it('should extract signature from headers', () => {
      // Arrange
      const headers = {
        'x-hub-signature-256': 'sha256=test-signature',
        'content-type': 'application/json',
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBe('sha256=test-signature');
    });

    it('should handle array header values', () => {
      // Arrange
      const headers = {
        'x-hub-signature-256': ['sha256=first-signature', 'sha256=second-signature'],
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBe('sha256=first-signature');
    });

    it('should return undefined when signature header is missing', () => {
      // Arrange
      const headers = {
        'content-type': 'application/json',
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBeUndefined();
    });

    it('should handle undefined header value', () => {
      // Arrange
      const headers = {
        'x-hub-signature-256': undefined,
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBeUndefined();
    });
  });

  describe('verifyGitHubWebhook', () => {
    it('should not throw for valid webhook', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')}`;
      const headers = {
        'x-hub-signature-256': signature,
      };

      // Act & Assert
      await expect(verifyGitHubWebhook(payload, headers)).resolves.not.toThrow();
    });

    it('should throw when signature is missing', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const headers = {};

      // Act & Assert
      await expect(verifyGitHubWebhook(payload, headers)).rejects.toThrow(
        'Missing X-Hub-Signature-256 header'
      );
    });

    it('should throw when signature is invalid', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const headers = {
        'x-hub-signature-256': 'sha256=invalid-signature',
      };

      // Act & Assert
      await expect(verifyGitHubWebhook(payload, headers)).rejects.toThrow(
        'Invalid webhook signature'
      );
    });

    it('should include error code in thrown error', async () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const headers = {
        'x-hub-signature-256': 'sha256=invalid-signature',
      };

      // Act
      let error: any;
      try {
        await verifyGitHubWebhook(payload, headers);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeDefined();
      expect(error.code).toBe(GitHubErrorCode.WEBHOOK_VERIFICATION_FAILED);
    });
  });
});
