import { beforeAll, describe, expect, it } from 'vitest';
import { getSecretSync } from '@buster/secrets';
import type {
  ISlackOAuthStateStorage,
  ISlackTokenStorage,
  SlackOAuthStateData,
} from '../interfaces/token-storage';
import type { SlackOAuthConfig } from '../types';
import { SlackAuthService } from './auth';

// Only run if environment is configured
const hasSlackConfig = (): boolean => {
  try {
    getSecretSync('SLACK_BOT_TOKEN');
    getSecretSync('SLACK_CHANNEL_ID');
    return true;
  } catch {
    return false;
  }
};

const runIntegrationTests = hasSlackConfig();

const describeIntegration = runIntegrationTests ? describe : describe.skip;

// Simple in-memory storage implementations for testing
class InMemoryTokenStorage implements ISlackTokenStorage {
  private tokens = new Map<string, string>();

  async storeToken(key: string, token: string): Promise<void> {
    this.tokens.set(key, token);
  }

  async getToken(key: string): Promise<string | null> {
    return this.tokens.get(key) || null;
  }

  async deleteToken(key: string): Promise<void> {
    this.tokens.delete(key);
  }

  async hasToken(key: string): Promise<boolean> {
    return this.tokens.has(key);
  }
}

class InMemoryStateStorage implements ISlackOAuthStateStorage {
  private states = new Map<string, SlackOAuthStateData>();

  async storeState(state: string, data: SlackOAuthStateData): Promise<void> {
    this.states.set(state, data);
  }

  async getState(state: string): Promise<SlackOAuthStateData | null> {
    return this.states.get(state) || null;
  }

  async deleteState(state: string): Promise<void> {
    this.states.delete(state);
  }
}

describeIntegration('SlackAuthService Integration', () => {
  let authService: SlackAuthService;
  let tokenStorage: ISlackTokenStorage;
  let stateStorage: ISlackOAuthStateStorage;
  let botToken: string;

  // Mock OAuth config for testing
  const mockConfig: SlackOAuthConfig = {
    clientId: process.env.SLACK_CLIENT_ID || 'test-client-id',
    clientSecret: process.env.SLACK_CLIENT_SECRET || 'test-client-secret',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'https://example.com/slack/callback',
    scopes: ['channels:read', 'chat:write', 'channels:manage'],
  };

  beforeAll(() => {
    botToken = process.env.SLACK_BOT_TOKEN!;
    tokenStorage = new InMemoryTokenStorage();
    stateStorage = new InMemoryStateStorage();
    authService = new SlackAuthService(mockConfig, tokenStorage, stateStorage);
  });

  describe('OAuth URL Generation', () => {
    it('should generate valid OAuth URL with state', async () => {
      const { authUrl, state } = await authService.generateAuthUrl({
        userId: 'test-user-123',
        source: 'integration-test',
      });

      expect(authUrl).toBeTruthy();
      expect(state).toBeTruthy();
      expect(state.length).toBeGreaterThan(20); // Should be secure

      // Parse URL to check parameters
      const url = new URL(authUrl);
      expect(url.hostname).toBe('slack.com');
      expect(url.pathname).toBe('/oauth/v2/authorize');
      expect(url.searchParams.get('client_id')).toBe(mockConfig.clientId);
      expect(url.searchParams.get('state')).toBe(state);
      expect(url.searchParams.get('redirect_uri')).toBe(mockConfig.redirectUri);
      expect(url.searchParams.get('scope')).toBe(mockConfig.scopes.join(','));
    });

    it('should store state for CSRF protection', async () => {
      const { state } = await authService.generateAuthUrl({
        testData: 'integration-test',
      });

      // Verify state was stored
      const storedState = await stateStorage.getState(state);
      expect(storedState).toBeTruthy();
      expect(storedState?.metadata).toEqual({ testData: 'integration-test' });
      expect(storedState?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate unique states', async () => {
      const states = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const { state } = await authService.generateAuthUrl();
        states.add(state);
      }

      // All states should be unique
      expect(states.size).toBe(10);
    });
  });

  describe('Token Validation', () => {
    it('should validate a real bot token', async () => {
      // Store the bot token
      await tokenStorage.storeToken('test-bot', botToken);

      // Test it
      const isValid = await authService.testToken('test-bot');
      expect(isValid).toBe(true);
    });

    it('should fail validation for invalid token', async () => {
      // Store an invalid token
      await tokenStorage.storeToken('invalid-bot', 'xoxb-invalid-token');

      // Test it
      const isValid = await authService.testToken('invalid-bot');
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      const isValid = await authService.testToken('non-existent-key');
      expect(isValid).toBe(false);
    });
  });

  describe('Token Revocation', () => {
    // WARNING: Never use real bot tokens in revocation tests!
    // Revoking a real token will permanently invalidate it and uninstall your app
    it('should remove token from storage when revoking', async () => {
      // Store a token
      const testKey = 'revoke-test';
      await tokenStorage.storeToken(testKey, 'xoxb-test-token');

      // Verify it's stored
      expect(await tokenStorage.hasToken(testKey)).toBe(true);

      // Revoke it
      await authService.revokeToken(testKey);

      // Verify it's gone
      expect(await tokenStorage.hasToken(testKey)).toBe(false);
    });

    it('should handle revoking non-existent token gracefully', async () => {
      // Should not throw
      await expect(authService.revokeToken('non-existent-token')).resolves.toBeUndefined();
    });

    it('should handle revocation errors gracefully', async () => {
      // Store an invalid token that will fail revocation
      const testKey = 'revoke-error-test';
      const invalidToken = 'xoxb-invalid-mock-token';
      await tokenStorage.storeToken(testKey, invalidToken);

      // Should not throw, but should still remove from storage
      await authService.revokeToken(testKey);
      expect(await tokenStorage.hasToken(testKey)).toBe(false);
    });
  });

  describe('OAuth Flow Error Handling', () => {
    it('should reject callback with invalid state', async () => {
      await expect(
        authService.handleCallback('fake-code', 'invalid-state', 'user-123')
      ).rejects.toThrow('Invalid or expired OAuth state');
    });

    it('should reject callback with expired state', async () => {
      // Create an expired state
      const expiredState = 'expired-state-123';
      await stateStorage.storeState(expiredState, {
        expiresAt: Date.now() - 1000, // Already expired
        metadata: {},
      });

      await expect(
        authService.handleCallback('fake-code', expiredState, 'user-123')
      ).rejects.toThrow('OAuth state has expired');
    });

    it('should clean up state even on error', async () => {
      // Create a valid state
      const testState = 'test-state-cleanup';
      await stateStorage.storeState(testState, {
        expiresAt: Date.now() + 60000,
        metadata: {},
      });

      // Try to use it (will fail due to invalid code)
      try {
        await authService.handleCallback('invalid-code', testState, 'user-123');
      } catch {
        // Expected to fail
      }

      // State should be cleaned up
      const remainingState = await stateStorage.getState(testState);
      expect(remainingState).toBeNull();
    });
  });

  describe('State Generation Security', () => {
    it('should generate cryptographically secure states', async () => {
      const states: string[] = [];

      // Generate multiple states
      for (let i = 0; i < 100; i++) {
        const { state } = await authService.generateAuthUrl();
        states.push(state);
      }

      // Check for sufficient entropy
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(100); // All should be unique

      // Check minimum length for security
      for (const state of states) {
        expect(state.length).toBeGreaterThanOrEqual(32);
        // Should be URL-safe
        expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    });
  });

  describe('Storage Integration', () => {
    it('should properly integrate with token storage', async () => {
      const testKey = 'storage-integration-test';
      const mockToken = 'xoxb-mock-token-for-testing';

      // Store mock token (NOT the real bot token!)
      await tokenStorage.storeToken(testKey, mockToken);

      // Verify storage works
      const storedToken = await tokenStorage.getToken(testKey);
      expect(storedToken).toBe(mockToken);

      // Delete from storage (without calling Slack API)
      await tokenStorage.deleteToken(testKey);

      // Verify it's gone
      const hasToken = await tokenStorage.hasToken(testKey);
      expect(hasToken).toBe(false);
    });

    it('should handle concurrent operations safely', async () => {
      // Generate multiple auth URLs concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        authService.generateAuthUrl({ index: i })
      );

      const results = await Promise.all(promises);

      // All should succeed with unique states
      const states = results.map((r) => r.state);
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(10);
    });
  });
});
