import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env before importing the module that uses it
// Use getters to read from process.env so test modifications work
vi.mock('../../env', () => ({
  env: {
    get VITE_PUBLIC_URL() {
      return process.env.VITE_PUBLIC_URL ?? 'https://example.com';
    },
    get SUPABASE_URL() {
      return process.env.SUPABASE_URL ?? 'https://example.com';
    },
    get SUPABASE_SERVICE_ROLE_KEY() {
      return process.env.SUPABASE_SERVICE_ROLE_KEY ?? '123';
    },
  },
}));

import { createHrefFromLink } from './create-href-from-link';

describe('createHrefFromLink', () => {
  const originalEnv = process.env.VITE_PUBLIC_URL;

  beforeEach(() => {
    process.env.VITE_PUBLIC_URL = 'https://example.com';
    process.env.SUPABASE_URL = 'https://example.com';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '123';
  });

  afterEach(() => {
    process.env.VITE_PUBLIC_URL = originalEnv;
  });

  it('should replace single param placeholder with value', () => {
    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
    });

    expect(result).toBe('https://example.com/metrics/123');
  });

  it('should replace multiple param placeholders with values', () => {
    const result = createHrefFromLink({
      to: '/orgs/$orgId/metrics/$metricId',
      params: { orgId: 'org-456', metricId: '123' },
    });

    expect(result).toBe('https://example.com/orgs/org-456/metrics/123');
  });

  it('should append query parameters', () => {
    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
      search: { width: 800, height: 600 },
    });

    expect(result).toBe('https://example.com/metrics/123?width=800&height=600');
  });

  it('should handle string, number, and boolean query params', () => {
    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
      search: { type: 'png', width: 800, fullscreen: true },
    });

    expect(result).toBe('https://example.com/metrics/123?type=png&width=800&fullscreen=true');
  });

  it('should filter out undefined query params', () => {
    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
      search: { width: 800, height: undefined, type: 'png' },
    });

    expect(result).toBe('https://example.com/metrics/123?width=800&type=png');
  });

  it('should work without query params', () => {
    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
    });

    expect(result).toBe('https://example.com/metrics/123');
  });

  it('should work with empty query params object', () => {
    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
      search: {},
    });

    expect(result).toBe('https://example.com/metrics/123');
  });

  it('should handle paths without params', () => {
    const result = createHrefFromLink({
      to: '/health',
      params: {},
      search: { check: 'full' },
    });

    expect(result).toBe('https://example.com/health?check=full');
  });

  it('should work with empty base URL', () => {
    process.env.VITE_PUBLIC_URL = '';

    const result = createHrefFromLink({
      to: '/metrics/$metricId',
      params: { metricId: '123' },
    });

    expect(result).toBe('/metrics/123');
  });

  it('should handle complex screenshot route', () => {
    const result = createHrefFromLink({
      to: '/screenshots/metrics/$metricId/content',
      params: { metricId: 'abc-123' },
      search: { version_number: 5, type: 'png', width: 1920, height: 1080 },
    });

    expect(result).toBe(
      'https://example.com/screenshots/metrics/abc-123/content?version_number=5&type=png&width=1920&height=1080'
    );
  });
});
