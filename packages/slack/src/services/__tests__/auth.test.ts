import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISlackOAuthStateStorage, ISlackTokenStorage } from '../../interfaces/token-storage';
import { SlackAuthService } from '../auth';

describe('SlackAuthService', () => {
  let authService: SlackAuthService;
  let mockTokenStorage: ISlackTokenStorage;
  let mockStateStorage: ISlackOAuthStateStorage;

  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://app.example.com/slack/callback',
    scopes: ['channels:read', 'chat:write'],
  };

  beforeEach(() => {
    // Mock token storage
    mockTokenStorage = {
      storeToken: vi.fn().mockResolvedValue(undefined),
      getToken: vi.fn().mockResolvedValue(null),
      deleteToken: vi.fn().mockResolvedValue(undefined),
      hasToken: vi.fn().mockResolvedValue(false),
    };

    // Mock state storage
    mockStateStorage = {
      storeState: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn().mockResolvedValue(null),
      deleteState: vi.fn().mockResolvedValue(undefined),
    };

    authService = new SlackAuthService(config, mockTokenStorage, mockStateStorage);
  });

  describe('generateAuthUrl', () => {
    it('should generate auth URL with correct parameters', async () => {
      const { authUrl, state } = await authService.generateAuthUrl({ userId: 'user-123' });

      expect(authUrl).toContain('slack.com/oauth/v2/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('scope=channels%3Aread%2Cchat%3Awrite');
      expect(state).toBeTruthy();
      expect(mockStateStorage.storeState).toHaveBeenCalledWith(
        state,
        expect.objectContaining({
          expiresAt: expect.any(Number),
          metadata: { userId: 'user-123' },
        })
      );
    });
  });

  describe('handleCallback', () => {
    it('should handle successful OAuth callback', async () => {
      // Mock state validation
      vi.mocked(mockStateStorage.getState).mockResolvedValue({
        expiresAt: Date.now() + 60000,
        metadata: { userId: 'user-123' },
      });

      // Mock successful OAuth response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            access_token: 'xoxb-test-token',
            token_type: 'bot',
            scope: 'channels:read,chat:write',
            bot_user_id: 'U123',
            app_id: 'A123',
            team: { id: 'T123', name: 'Test Team' },
            authed_user: {
              id: 'U456',
              scope: 'channels:read,chat:write',
              access_token: 'xoxu-test-token',
              token_type: 'user',
            },
          }),
      });

      // Mock WebClient auth test
      const mockAuthTest = vi.fn().mockResolvedValue({ ok: true });
      (authService as any).slackClient.auth = { test: mockAuthTest };

      const result = await authService.handleCallback('test-code', 'test-state', 'user-123');

      expect(result).toMatchObject({
        teamId: 'T123',
        teamName: 'Test Team',
        botUserId: 'U123',
        accessToken: 'xoxb-test-token',
      });

      expect(mockTokenStorage.storeToken).toHaveBeenCalledWith('user-123', 'xoxb-test-token');
      expect(mockStateStorage.deleteState).toHaveBeenCalledWith('test-state');
    });

    it('should handle invalid state', async () => {
      vi.mocked(mockStateStorage.getState).mockResolvedValue(null);

      await expect(
        authService.handleCallback('test-code', 'invalid-state', 'user-123')
      ).rejects.toThrow('Invalid or expired OAuth state');
    });

    it('should handle expired state', async () => {
      vi.mocked(mockStateStorage.getState).mockResolvedValue({
        expiresAt: Date.now() - 60000, // Expired
        metadata: {},
      });

      await expect(
        authService.handleCallback('test-code', 'expired-state', 'user-123')
      ).rejects.toThrow('OAuth state has expired');
    });
  });

  describe('testToken', () => {
    it('should return true for valid token', async () => {
      vi.mocked(mockTokenStorage.getToken).mockResolvedValue('xoxb-valid-token');

      const mockAuthTest = vi.fn().mockResolvedValue({ ok: true });
      (authService as any).slackClient.auth = { test: mockAuthTest };

      const result = await authService.testToken('user-123');

      expect(result).toBe(true);
      expect(mockAuthTest).toHaveBeenCalledWith({ token: 'xoxb-valid-token' });
    });

    it('should return false for missing token', async () => {
      vi.mocked(mockTokenStorage.getToken).mockResolvedValue(null);

      const result = await authService.testToken('user-123');

      expect(result).toBe(false);
    });
  });
});
