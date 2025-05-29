import axios, { type AxiosError, type InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rustErrorHandler } from './buster_rest/errors';
import { createInstance, defaultRequestHandler } from './createInstance';

// Mock dependencies
vi.mock('axios');
vi.mock('./buster_rest/errors');
vi.mock('./createServerInstance');
vi.mock('@tanstack/react-query', () => ({
  isServer: false
}));

describe('createInstance', () => {
  const mockBaseURL = 'https://api.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.create as any).mockReturnValue({
      interceptors: {
        response: { use: vi.fn() },
        request: { use: vi.fn() }
      }
    });
  });

  it('creates an axios instance with correct configuration', () => {
    createInstance(mockBaseURL);

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: mockBaseURL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('sets up response interceptors', () => {
    const mockInstance = {
      interceptors: {
        response: { use: vi.fn() },
        request: { use: vi.fn() }
      }
    };
    (axios.create as any).mockReturnValue(mockInstance);

    createInstance(mockBaseURL);

    expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
    expect(mockInstance.interceptors.request.use).toHaveBeenCalledWith(defaultRequestHandler);
  });

  it('handles errors in response interceptor', async () => {
    const mockError = new Error('API Error') as AxiosError;
    const mockInstance = {
      interceptors: {
        response: { use: vi.fn() },
        request: { use: vi.fn() }
      }
    };
    (axios.create as any).mockReturnValue(mockInstance);
    (rustErrorHandler as any).mockReturnValue('Processed Error');

    // Get the error handler by capturing the second argument passed to use()
    createInstance(mockBaseURL);
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];

    // Test the error handler
    await expect(errorHandler(mockError)).rejects.toBe('Processed Error');
    expect(rustErrorHandler).toHaveBeenCalledWith(mockError);
  });
});

describe('defaultRequestHandler', () => {
  const mockConfig: InternalAxiosRequestConfig = {
    headers: new AxiosHeaders(),
    method: 'get',
    url: 'test'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('adds authorization header with token in client environment', async () => {
    const mockToken = 'test-token';
    const mockCheckTokenValidity = vi.fn().mockResolvedValue({
      access_token: mockToken,
      isTokenValid: true
    });

    const result = await defaultRequestHandler(mockConfig, {
      checkTokenValidity: () => Promise.resolve(mockCheckTokenValidity())
    });

    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('handles empty token gracefully', async () => {
    const mockCheckTokenValidity = vi.fn().mockResolvedValue({
      access_token: '',
      isTokenValid: false
    });

    const result = await defaultRequestHandler(mockConfig, {
      checkTokenValidity: () => Promise.resolve(mockCheckTokenValidity())
    });

    expect(result.headers.Authorization).toBe('Bearer ');
  });

  it('preserves existing config properties', async () => {
    const originalConfig: InternalAxiosRequestConfig = {
      ...mockConfig,
      timeout: 5000,
      baseURL: 'https://api.example.com'
    };

    const result = await defaultRequestHandler(originalConfig, {
      checkTokenValidity: () =>
        Promise.resolve({
          access_token: 'token',
          isTokenValid: true
        })
    });

    expect(result.timeout).toBe(5000);
    expect(result.baseURL).toBe('https://api.example.com');
  });
});
