import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProxiedResponse, extractParamFromWhere, getElectricShapeUrl } from './_helpers';

describe('getElectricShapeUrl', () => {
  process.env.ELECTRIC_URL = 'http://localhost:3000';
  const originalElectricUrl = process.env.ELECTRIC_URL;

  beforeEach(() => {
    // Clean up environment variable before each test
    process.env.ELECTRIC_URL = undefined;
  });

  afterEach(() => {
    // Restore original environment variable after each test
    if (originalElectricUrl !== undefined) {
      process.env.ELECTRIC_URL = originalElectricUrl;
    } else {
      process.env.ELECTRIC_URL = undefined;
    }
  });

  it('should return default URL with /v1/shape path when no ELECTRIC_URL is set', () => {
    const requestUrl = 'http://example.com/test?table=users';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('http://localhost:3000/v1/shape?table=users');
  });

  it('should use ELECTRIC_URL environment variable when set', () => {
    process.env.ELECTRIC_URL = 'https://electric.example.com';
    const requestUrl = 'http://example.com/test?table=users&live=true';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('https://electric.example.com/v1/shape?table=users&live=true');
  });

  it('should copy allowed query parameters', () => {
    const requestUrl = 'http://example.com/test?live=true&table=users&handle=abc123&offset=100';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('live')).toBe('true');
    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('handle')).toBe('abc123');
    expect(result.searchParams.get('offset')).toBe('100');
  });

  it('should copy all allowed query parameters', () => {
    const allowedParams = [
      'live=true',
      'table=users',
      'handle=abc123',
      'offset=100',
      'cursor=xyz789',
      'where=id>10',
      'params={"key":"value"}',
      'columns=id,name',
      'replica=primary',
      'secret=secret123',
    ];

    const requestUrl = `http://example.com/test?${allowedParams.join('&')}`;
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('live')).toBe('true');
    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('handle')).toBe('abc123');
    expect(result.searchParams.get('offset')).toBe('100');
    expect(result.searchParams.get('cursor')).toBe('xyz789');
    expect(result.searchParams.get('where')).toBe('id>10');
    expect(result.searchParams.get('params')).toBe('{"key":"value"}');
    expect(result.searchParams.get('columns')).toBe('id,name');
    expect(result.searchParams.get('replica')).toBe('primary');
    expect(result.searchParams.get('secret')).toBe('secret123');
  });

  it('should not copy disallowed query parameters', () => {
    const requestUrl = 'http://example.com/test?table=users&forbidden=value&another=param&limit=50';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('forbidden')).toBeNull();
    expect(result.searchParams.get('another')).toBeNull();
    expect(result.searchParams.get('limit')).toBeNull();
  });

  it('should handle mixed allowed and disallowed parameters', () => {
    const requestUrl =
      'http://example.com/test?live=true&forbidden=value&table=users&limit=50&handle=abc';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('live')).toBe('true');
    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('handle')).toBe('abc');
    expect(result.searchParams.get('forbidden')).toBeNull();
    expect(result.searchParams.get('limit')).toBeNull();
  });

  it('should handle URL with no query parameters', () => {
    const requestUrl = 'http://example.com/test';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('http://localhost:3000/v1/shape');
    expect(result.searchParams.toString()).toBe('');
  });

  it('should handle empty query parameter values', () => {
    const requestUrl = 'http://example.com/test?table=&live=true&handle=';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('');
    expect(result.searchParams.get('live')).toBe('true');
    expect(result.searchParams.get('handle')).toBe('');
  });

  it('should handle URL-encoded query parameters', () => {
    const requestUrl = 'http://example.com/test?where=id%3E10&params=%7B%22key%22%3A%22value%22%7D';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('where')).toBe('id>10');
    expect(result.searchParams.get('params')).toBe('{"key":"value"}');
  });

  it('should handle complex where clause with special characters', () => {
    const whereClause = "name='John Doe' AND age>18";
    const encodedWhere = encodeURIComponent(whereClause);
    const requestUrl = `http://example.com/test?table=users&where=${encodedWhere}`;
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('where')).toBe(whereClause);
  });

  it('should preserve multiple values for the same parameter', () => {
    // Note: URL constructor handles multiple params by taking the last value
    const requestUrl = 'http://example.com/test?table=users&table=posts';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('posts');
  });

  it('should handle ELECTRIC_URL with trailing slash', () => {
    process.env.ELECTRIC_URL = 'https://electric.example.com/';
    const requestUrl = 'http://example.com/test?table=users';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('https://electric.example.com/v1/shape?table=users');
  });

  it('should handle ELECTRIC_URL with path', () => {
    process.env.ELECTRIC_URL = 'https://api.example.com/electric';
    const requestUrl = 'http://example.com/test?table=users';
    const result = getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('https://api.example.com/v1/shape?table=users');
  });
});

describe('createProxiedResponse', () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.clearAllMocks();
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

  it('should handle fetch errors', async () => {
    const testUrl = new URL('https://example.com/error');
    const fetchError = new Error('Network error');

    mockFetch.mockRejectedValueOnce(fetchError);

    await expect(createProxiedResponse(testUrl)).rejects.toThrow('Network error');
    expect(mockFetch).toHaveBeenCalledWith(testUrl);
  });
});

describe('extractParamFromWhere', () => {
  it('should', () => {
    const testClause = "where=id='420226c8-b91d-49c5-99f8-660b04cc8c01'&offset=-1";
    const url = new URL(`https://example.com/test?${testClause}`);
    const result = extractParamFromWhere(url, 'id');

    expect(result).not.toBeNull();
    expect(result).toBe('420226c8-b91d-49c5-99f8-660b04cc8c01');
  });

  it('should extract parameter with single quotes', () => {
    const url = new URL("https://example.com/test?where=chatId='123'");
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe('123');
  });

  it('should extract parameter with double quotes', () => {
    const url = new URL('https://example.com/test?where=userId="456"');
    const result = extractParamFromWhere(url, 'userId');

    expect(result).not.toBeNull();
    expect(result).toBe('456');
  });

  it('should return null when where parameter is missing', () => {
    const url = new URL('https://example.com/test?table=users');
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).toBeNull();
  });

  it('should return null when parameter name is not found in where clause', () => {
    const url = new URL("https://example.com/test?where=otherId='123'");
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).toBeNull();
  });

  it('should extract parameter from complex where clause', () => {
    const url = new URL(
      "https://example.com/test?where=status='active' AND chatId='789' AND type='message'"
    );
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe('789');
  });

  it('should extract parameter with special characters in value', () => {
    const url = new URL("https://example.com/test?where=chatId='abc-123_xyz'");
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe('abc-123_xyz');
  });

  it('should extract parameter with numeric value', () => {
    const url = new URL("https://example.com/test?where=userId='12345'");
    const result = extractParamFromWhere(url, 'userId');

    expect(result).not.toBeNull();
    expect(result).toBe('12345');
  });

  it('should handle empty where clause', () => {
    const url = new URL('https://example.com/test?where=');
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).toBeNull();
  });

  it('should extract first occurrence when parameter appears multiple times', () => {
    const url = new URL("https://example.com/test?where=chatId='first' AND chatId='second'");
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe('first');
  });

  it('should handle URL-encoded where clause', () => {
    const whereClause = "chatId='test123'";
    const encodedWhere = encodeURIComponent(whereClause);
    const url = new URL(`https://example.com/test?where=${encodedWhere}`);
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe('test123');
  });

  it('should handle parameter with spaces in value', () => {
    const url = new URL("https://example.com/test?where=name='John Doe'");
    const result = extractParamFromWhere(url, 'name');

    expect(result).not.toBeNull();
    expect(result).toBe('John Doe');
  });

  it('should handle parameter with empty value', () => {
    const url = new URL("https://example.com/test?where=chatId=''");
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).toBeNull(); // Empty string doesn't match the regex [^'"]+
  });

  it('should handle mixed quote types in same where clause', () => {
    const url = new URL(`https://example.com/test?where=chatId='123' AND userId="456"`);
    const result1 = extractParamFromWhere(url, 'chatId');
    const result2 = extractParamFromWhere(url, 'userId');

    expect(result1).not.toBeNull();
    expect(result1).toBe('123');

    expect(result2).not.toBeNull();
    expect(result2).toBe('456');
  });

  it('should handle multiple paramater in a realistic example', () => {
    const params = 'id="420226c8-b91d-49c5-99f8-660b04cc8c01"ANDmessage_id="123"';
    const url = new URL(`https://example.com/test?where=${params}`);
    const result = extractParamFromWhere(url, 'id');

    expect(result).not.toBeNull();
    expect(result).toBe('420226c8-b91d-49c5-99f8-660b04cc8c01');

    const result2 = extractParamFromWhere(url, 'message_id');

    expect(result2).not.toBeNull();
    expect(result2).toBe('123');
  });

  it('should handle parameter names that are substrings of other parameters', () => {
    const url = new URL("https://example.com/test?where=chatId='123' AND chatIdExtra='456'");
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe('123');
  });

  it('should handle parameter with UUID value', () => {
    const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const url = new URL(`https://example.com/test?where=chatId='${uuid}'`);
    const result = extractParamFromWhere(url, 'chatId');

    expect(result).not.toBeNull();
    expect(result).toBe(uuid);
  });
});
