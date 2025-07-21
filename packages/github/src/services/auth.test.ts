import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubAuthService } from './auth';
import { createMockOctokit } from '../mocks';
import type { IGitHubOAuthStateStorage, IGitHubTokenStorage } from '../interfaces/token-storage';

const mockTokenStorage: IGitHubTokenStorage = {
  storeToken: vi.fn(),
  getToken: vi.fn(),
  deleteToken: vi.fn(),
  hasToken: vi.fn(),
};

const mockStateStorage: IGitHubOAuthStateStorage = {
  storeState: vi.fn(),
  getState: vi.fn(),
  deleteState: vi.fn(),
};

const mockConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'https://example.com/callback',
  scopes: ['repo', 'workflow'],
};

describe('GitHubAuthService', () => {
  let service: GitHubAuthService;
  let mockClient: ReturnType<typeof createMockOctokit>;

  beforeEach(() => {
    mockClient = createMockOctokit();
    service = new GitHubAuthService(
      mockConfig,
      mockTokenStorage,
      mockStateStorage,
      mockClient as any
    );
    vi.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate auth URL with correct parameters', async () => {
      const metadata = { userId: 'test-user' };
      const result = await service.generateAuthUrl(metadata);

      expect(result.authUrl).toContain('https://github.com/login/oauth/authorize');
      expect(result.authUrl).toContain('client_id=test-client-id');
      expect(result.authUrl).toContain('scope=repo+workflow');
      expect(result.state).toBeDefined();
      expect(mockStateStorage.storeState).toHaveBeenCalled();
    });
  });

  describe('testToken', () => {
    it('should return true for valid token', async () => {
      vi.mocked(mockTokenStorage.getToken).mockResolvedValue('valid-token');

      const result = await service.testToken('test-key');

      expect(result).toBe(true);
      expect(mockTokenStorage.getToken).toHaveBeenCalledWith('test-key');
    });

    it('should return false for missing token', async () => {
      vi.mocked(mockTokenStorage.getToken).mockResolvedValue(null);

      const result = await service.testToken('test-key');

      expect(result).toBe(false);
    });
  });
});
