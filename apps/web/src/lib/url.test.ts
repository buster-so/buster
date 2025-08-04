import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isUrlFromAcceptedDomain } from './url';

describe('isUrlFromAcceptedDomain', () => {
  beforeEach(() => {
    // Reset environment variable mock before each test
    vi.resetModules();
  });

  it('should return true for URLs from exact accepted domains', () => {
    // Test case: URLs from exact accepted domains should be allowed
    // Expected: All these URLs should return true
    expect(isUrlFromAcceptedDomain('https://twitter.com/status/123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://x.com/user/post')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://youtube.com/watch?v=123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://youtube-nocookie.com/embed/123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://vimeo.com/123456')).toBe(true);
    expect(isUrlFromAcceptedDomain('http://twitter.com')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://youtu.be/QrM39m22jH4?list=RDQrM39m22jH4')).toBe(true);
  });

  it('should return true for URLs from subdomains of accepted domains', () => {
    // Test case: URLs from subdomains of accepted domains should be allowed
    // Expected: All these subdomain URLs should return true
    expect(isUrlFromAcceptedDomain('https://www.twitter.com/status/123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://mobile.twitter.com/user')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://www.youtube.com/watch?v=123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://m.youtube.com/watch?v=123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://www.youtube-nocookie.com/embed/123')).toBe(true);
    expect(isUrlFromAcceptedDomain('https://player.vimeo.com/video/123')).toBe(true);
  });

  it('should return false for URLs from non-accepted domains', () => {
    // Test case: URLs from domains not in the accepted list should be rejected
    // Expected: All these URLs should return false
    expect(isUrlFromAcceptedDomain('https://facebook.com/post/123')).toBe(false);
    expect(isUrlFromAcceptedDomain('https://instagram.com/user')).toBe(false);
    expect(isUrlFromAcceptedDomain('https://tiktok.com/video/123')).toBe(false);
    expect(isUrlFromAcceptedDomain('https://malicious-site.com')).toBe(false);
  });

  it('should return false for invalid URLs and handle errors gracefully', () => {
    // Test case: Invalid URL strings should be handled gracefully and return false
    // Expected: All invalid URLs should return false without throwing errors
    expect(isUrlFromAcceptedDomain('not-a-url')).toBe(false);
    expect(isUrlFromAcceptedDomain('invalid://url')).toBe(false);
    expect(isUrlFromAcceptedDomain('')).toBe(false);
    expect(isUrlFromAcceptedDomain('javascript:alert("xss")')).toBe(false);
    expect(isUrlFromAcceptedDomain('ftp://twitter.com')).toBe(true); // Still valid URL format
    expect(isUrlFromAcceptedDomain('https://')).toBe(false); // Invalid URL
  });
});
