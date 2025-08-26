import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProxiedResponse } from './electricHandler';

// Mock @buster/secrets
vi.mock('@buster/secrets', () => ({
  getSecret: vi.fn(),
  ELECTRIC_KEYS: {
    ELECTRIC_PROXY_URL: 'ELECTRIC_PROXY_URL',
    ELECTRIC_SECRET: 'ELECTRIC_SECRET',
    ELECTRIC_SOURCE_ID: 'ELECTRIC_SOURCE_ID',
  },
}));

import { getSecret } from '@buster/secrets';

describe('createProxiedResponse', () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.clearAllMocks();
    // Default mock for getSecret - can be overridden in individual tests
    vi.mocked(getSecret).mockResolvedValue('test-secret');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should proxy a successful response and remove content-encoding and content-length headers', async () => {
    const testUrl = new URL('https://example.com/test');
    const mockResponseBody = 'test response body';

    // Create mock headers that include content-encoding and content-length
    const mockHeaders = new Headers({
      'content-type': 'application/json',
      'content-encoding': 'gzip',
      'content-length': '123',
      'cache-control': 'no-cache',
      'custom-header': 'custom-value',
    });

    const mockResponse = new Response(mockResponseBody, {
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(testUrl);

    // Verify response properties
    expect(await result.text()).toBe(mockResponseBody);
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('OK');

    // Verify headers were properly modified
    expect(result.headers.has('content-encoding')).toBe(false);
    expect(result.headers.has('content-length')).toBe(false);

    // Verify other headers are preserved
    expect(result.headers.get('content-type')).toBe('application/json');
    expect(result.headers.get('cache-control')).toBe('no-cache');
    expect(result.headers.get('custom-header')).toBe('custom-value');
  });

  it('should handle responses without content-encoding or content-length headers', async () => {
    const testUrl = new URL('https://example.com/test');
    const mockResponseBody = 'test response body';

    const mockHeaders = new Headers({
      'content-type': 'text/plain',
      'cache-control': 'max-age=3600',
    });

    const mockResponse = new Response(mockResponseBody, {
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify response properties
    expect(await result.text()).toBe(mockResponseBody);
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('OK');

    // Verify headers are preserved (nothing to remove)
    expect(result.headers.get('content-type')).toBe('text/plain');
    expect(result.headers.get('cache-control')).toBe('max-age=3600');
    expect(result.headers.has('content-encoding')).toBe(false);
    expect(result.headers.has('content-length')).toBe(false);
  });

  it('should proxy error responses correctly', async () => {
    const testUrl = new URL('https://example.com/error');

    const mockHeaders = new Headers({
      'content-type': 'application/json',
      'content-encoding': 'deflate',
      'content-length': '456',
    });

    const mockResponse = new Response('{"error": "Not found"}', {
      status: 404,
      statusText: 'Not Found',
      headers: mockHeaders,
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify error response is properly proxied
    expect(result.status).toBe(404);
    expect(result.statusText).toBe('Not Found');
    expect(await result.text()).toBe('{"error": "Not found"}');

    // Verify headers are still properly cleaned
    expect(result.headers.has('content-encoding')).toBe(false);
    expect(result.headers.has('content-length')).toBe(false);
    expect(result.headers.get('content-type')).toBe('application/json');
  });

  it('should handle responses with only content-encoding header', async () => {
    const testUrl = new URL('https://example.com/test');

    const mockHeaders = new Headers({
      'content-type': 'application/json',
      'content-encoding': 'br',
    });

    const mockResponse = new Response('compressed data', {
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify only content-encoding is removed
    expect(result.headers.has('content-encoding')).toBe(false);
    expect(result.headers.has('content-length')).toBe(false); // Should be false (wasn't present)
    expect(result.headers.get('content-type')).toBe('application/json');
  });

  it('should handle responses with only content-length header', async () => {
    const testUrl = new URL('https://example.com/test');

    const mockHeaders = new Headers({
      'content-type': 'text/html',
      'content-length': '789',
    });

    const mockResponse = new Response('<html></html>', {
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify only content-length is removed
    expect(result.headers.has('content-length')).toBe(false);
    expect(result.headers.has('content-encoding')).toBe(false); // Should be false (wasn't present)
    expect(result.headers.get('content-type')).toBe('text/html');
  });

  it('should preserve all other headers', async () => {
    const testUrl = new URL('https://example.com/test');

    const mockHeaders = new Headers({
      'content-type': 'application/json',
      'content-encoding': 'gzip',
      'content-length': '100',
      authorization: 'Bearer token123',
      'x-custom-header': 'custom-value',
      'cache-control': 'private, max-age=0',
      etag: '"abc123"',
      'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
    });

    const mockResponse = new Response('response data', {
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify the problematic headers are removed
    expect(result.headers.has('content-encoding')).toBe(false);
    expect(result.headers.has('content-length')).toBe(false);

    // Verify all other headers are preserved
    expect(result.headers.get('content-type')).toBe('application/json');
    expect(result.headers.get('authorization')).toBe('Bearer token123');
    expect(result.headers.get('x-custom-header')).toBe('custom-value');
    expect(result.headers.get('cache-control')).toBe('private, max-age=0');
    expect(result.headers.get('etag')).toBe('"abc123"');
    expect(result.headers.get('last-modified')).toBe('Wed, 21 Oct 2015 07:28:00 GMT');
  });

  it('should throw error when ELECTRIC_SECRET environment variable is not set', async () => {
    // Mock getSecret to return empty string for ELECTRIC_SECRET
    vi.mocked(getSecret).mockResolvedValue('');

    const testUrl = new URL('https://example.com/test');

    await expect(createProxiedResponse(testUrl)).rejects.toThrow('ELECTRIC_SECRET is not set');

    // Verify fetch was never called since error is thrown before
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should add secret key to URL params when ELECTRIC_SECRET is set', async () => {
    const secretKey = 'test-secret-key-123';
    vi.mocked(getSecret).mockResolvedValue(secretKey);

    const testUrl = new URL('https://example.com/test');
    const mockResponseBody = 'test response';

    const mockResponse = new Response(mockResponseBody, {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await createProxiedResponse(testUrl);

    // Verify fetch was called with URL that has secret parameter
    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = mockFetch.mock.calls[0]?.[0] as URL;
    expect(calledUrl.searchParams.get('secret')).toBe(secretKey);

    // Verify the response is still valid
    expect(await result.text()).toBe(mockResponseBody);
    expect(result.status).toBe(200);
  });
});
