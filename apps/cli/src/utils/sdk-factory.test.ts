import type { BusterSDK } from '@buster/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCachedSdk, createAuthenticatedSdk, getOrCreateSdk } from './sdk-factory';

// Mock the SDK module
vi.mock('@buster/sdk', () => ({
  createBusterSDK: vi.fn(),
}));

// Mock the credentials utility
vi.mock('./credentials', () => ({
  getCredentials: vi.fn(),
}));

// Import after mocks
import { createBusterSDK } from '@buster/sdk';
import { getCredentials } from './credentials';

describe('createAuthenticatedSdk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create SDK with valid credentials', async () => {
    const mockCredentials = {
      apiKey: 'test-api-key',
      apiUrl: 'https://api.test.com',
    };

    vi.mocked(getCredentials).mockResolvedValue(mockCredentials);

    const mockSdk = {
      config: mockCredentials,
      auth: { isApiKeyValid: vi.fn() },
      chats: { list: vi.fn() },
      messages: {
        create: vi.fn(),
        update: vi.fn(),
        getRawMessages: vi.fn(),
      },
    } as unknown as BusterSDK;

    vi.mocked(createBusterSDK).mockReturnValue(mockSdk);

    const result = await createAuthenticatedSdk();

    expect(getCredentials).toHaveBeenCalled();
    expect(createBusterSDK).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      apiUrl: 'https://api.test.com',
    });
    expect(result).toBe(mockSdk);
  });

  it('should throw when credentials missing', async () => {
    vi.mocked(getCredentials).mockResolvedValue(null);

    await expect(createAuthenticatedSdk()).rejects.toThrow(
      'No credentials found. Please login first using: buster login'
    );
  });

  it('should throw when credentials are incomplete', async () => {
    vi.mocked(getCredentials).mockResolvedValue({
      apiKey: '',
      apiUrl: 'https://api.test.com',
    });

    await expect(createAuthenticatedSdk()).rejects.toThrow(
      'Invalid credentials. Please login again using: buster login'
    );
  });

  it('should throw when API URL is missing', async () => {
    vi.mocked(getCredentials).mockResolvedValue({
      apiKey: 'test-key',
      apiUrl: '',
    });

    await expect(createAuthenticatedSdk()).rejects.toThrow(
      'Invalid credentials. Please login again using: buster login'
    );
  });

  it('should handle getCredentials errors', async () => {
    vi.mocked(getCredentials).mockRejectedValue(new Error('Read error'));

    await expect(createAuthenticatedSdk()).rejects.toThrow('Read error');
  });
});

describe('getOrCreateSdk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cached SDK instance
    clearCachedSdk();
  });

  it('should create new SDK on first call', async () => {
    const mockCredentials = {
      apiKey: 'test-api-key',
      apiUrl: 'https://api.test.com',
    };

    vi.mocked(getCredentials).mockResolvedValue(mockCredentials);

    const mockSdk = {
      config: mockCredentials,
      auth: { isApiKeyValid: vi.fn() },
      chats: { list: vi.fn() },
      messages: {
        create: vi.fn(),
        update: vi.fn(),
        getRawMessages: vi.fn(),
      },
    } as unknown as BusterSDK;

    vi.mocked(createBusterSDK).mockReturnValue(mockSdk);

    const result = await getOrCreateSdk();

    expect(createBusterSDK).toHaveBeenCalledOnce();
    expect(result).toBe(mockSdk);
  });

  it('should return cached SDK instance on subsequent calls', async () => {
    const mockCredentials = {
      apiKey: 'test-api-key',
      apiUrl: 'https://api.test.com',
    };

    vi.mocked(getCredentials).mockResolvedValue(mockCredentials);

    const mockSdk = {
      config: mockCredentials,
      auth: { isApiKeyValid: vi.fn() },
      chats: { list: vi.fn() },
      messages: {
        create: vi.fn(),
        update: vi.fn(),
        getRawMessages: vi.fn(),
      },
    } as unknown as BusterSDK;

    vi.mocked(createBusterSDK).mockReturnValue(mockSdk);

    // First call - should create
    const result1 = await getOrCreateSdk();

    // Second call - should return cached
    const result2 = await getOrCreateSdk();

    // Should only create SDK once
    expect(createBusterSDK).toHaveBeenCalledOnce();

    // Both results should be the same instance
    expect(result1).toBe(result2);
    expect(result2).toBe(mockSdk);
  });

  it('should throw when credentials are missing', async () => {
    vi.mocked(getCredentials).mockResolvedValue(null);

    await expect(getOrCreateSdk()).rejects.toThrow(
      'No credentials found. Please login first using: buster login'
    );
  });
});
