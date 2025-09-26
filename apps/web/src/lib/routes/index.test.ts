import type { ParsedLocation } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFullURL } from './index';

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://example.com',
  },
  writable: true,
});

describe('createFullURL', () => {
  beforeEach(() => {
    // Reset window.location.origin before each test
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com',
      },
      writable: true,
    });
  });

  it('should create full URL from string input', () => {
    // Test case: String input should be appended to window.location.origin
    // Expected: Should return the origin combined with the path string
    const path = '/dashboard/metrics';
    const result = createFullURL(path);

    expect(result).toBe('https://example.com/dashboard/metrics');
  });

  it('should create full URL from ParsedLocation input', () => {
    // Test case: ParsedLocation input should use the href property
    // Expected: Should return the origin combined with the ParsedLocation.href
    const mockLocation: ParsedLocation = {
      href: '/reports/123?tab=overview',
      pathname: '/reports/123',
      search: { tab: 'overview' },
      searchStr: '?tab=overview',
      state: { __TSR_index: 0 },
      hash: '',
      key: 'test-key',
      maskedLocation: undefined,
      publicHref: '/reports/123?tab=overview',
      url: '/reports/123?tab=overview',
    } as unknown as ParsedLocation;

    const result = createFullURL(mockLocation);

    expect(result).toBe('https://example.com/reports/123?tab=overview');
  });
});
