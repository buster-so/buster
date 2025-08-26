import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { extractParamFromWhere, getElectricShapeUrl } from '.';

describe('getElectricShapeUrl', () => {
  let originalElectricUrl: string | undefined;
  let originalSourceId: string | undefined;

  beforeEach(() => {
    // Save original environment variables
    originalElectricUrl = process.env.ELECTRIC_PROXY_URL;
    originalSourceId = process.env.ELECTRIC_SOURCE_ID;

    // Set default test values
    process.env.ELECTRIC_PROXY_URL = 'http://localhost:3000';
    process.env.ELECTRIC_SOURCE_ID = '';
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalElectricUrl !== undefined) {
      process.env.ELECTRIC_PROXY_URL = originalElectricUrl;
    } else {
      delete process.env.ELECTRIC_PROXY_URL;
    }

    if (originalSourceId !== undefined) {
      process.env.ELECTRIC_SOURCE_ID = originalSourceId;
    } else {
      delete process.env.ELECTRIC_SOURCE_ID;
    }
  });

  it('should return default URL with /v1/shape path when no ELECTRIC_PROXY_URL is set', async () => {
    const requestUrl = 'http://example.com/test?table=users';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('http://localhost:3000/v1/shape?table=users');
  });

  it('should use ELECTRIC_PROXY_URL environment variable when set', async () => {
    process.env.ELECTRIC_PROXY_URL = 'https://electric.example.com';
    const requestUrl = 'http://example.com/test?table=users&live=true';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('https://electric.example.com/v1/shape?table=users&live=true');
  });

  it('should copy allowed query parameters', async () => {
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
    const result = await getElectricShapeUrl(requestUrl);

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

  it('should copy all allowed query parameters', async () => {
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
    const result = await getElectricShapeUrl(requestUrl);

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

  it('should not copy disallowed query parameters', async () => {
    const requestUrl = 'http://example.com/test?table=users&forbidden=value&another=param&limit=50';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('forbidden')).toBeNull();
    expect(result.searchParams.get('another')).toBeNull();
    expect(result.searchParams.get('limit')).toBeNull();
  });

  it('should handle mixed allowed and disallowed parameters', async () => {
    const requestUrl =
      'http://example.com/test?live=true&forbidden=value&table=users&limit=50&handle=abc';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('live')).toBe('true');
    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('handle')).toBe('abc');
    expect(result.searchParams.get('forbidden')).toBeNull();
    expect(result.searchParams.get('limit')).toBeNull();
  });

  it('should handle URL with no query parameters', async () => {
    const requestUrl = 'http://example.com/test';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('http://localhost:3000/v1/shape');
    expect(result.searchParams.toString()).toBe('');
  });

  it('should handle empty query parameter values', async () => {
    const requestUrl = 'http://example.com/test?table=&live=true&handle=';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('');
    expect(result.searchParams.get('live')).toBe('true');
    expect(result.searchParams.get('handle')).toBe('');
  });

  it('should handle URL-encoded query parameters', async () => {
    const requestUrl = 'http://example.com/test?where=id%3E10&params=%7B%22key%22%3A%22value%22%7D';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('where')).toBe('id>10');
    expect(result.searchParams.get('params')).toBe('{"key":"value"}');
  });

  it('should handle complex where clause with special characters', async () => {
    const whereClause = "name='John Doe' AND age>18";
    const encodedWhere = encodeURIComponent(whereClause);
    const requestUrl = `http://example.com/test?table=users&where=${encodedWhere}`;
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('users');
    expect(result.searchParams.get('where')).toBe(whereClause);
  });

  it('should preserve multiple values for the same parameter', async () => {
    // Note: URL constructor handles multiple params by taking the last value
    const requestUrl = 'http://example.com/test?table=users&table=posts';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.searchParams.get('table')).toBe('posts');
  });

  it('should handle ELECTRIC_PROXY_URL with trailing slash', async () => {
    process.env.ELECTRIC_PROXY_URL = 'https://electric.example.com/';
    const requestUrl = 'http://example.com/test?table=users';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('https://electric.example.com/v1/shape?table=users');
  });

  it('should handle ELECTRIC_PROXY_URL with path', async () => {
    process.env.ELECTRIC_PROXY_URL = 'https://api.example.com/electric';
    const requestUrl = 'http://example.com/test?table=users';
    const result = await getElectricShapeUrl(requestUrl);

    expect(result.toString()).toBe('https://api.example.com/v1/shape?table=users');
  });
});

describe('extractParamFromWhere', () => {
  it('should handle a simple where clause', () => {
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
