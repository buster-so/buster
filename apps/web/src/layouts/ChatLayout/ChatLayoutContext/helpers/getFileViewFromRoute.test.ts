import { describe, expect, it } from 'vitest';
import { BusterRoutes } from '@/routes/busterRoutes';
import { getFileViewFromRoute } from './getFileViewFromRoute';

describe('getFileViewFromRoute', () => {
  it('should return chart view for metric chart route', () => {
    expect(getFileViewFromRoute(BusterRoutes.APP_METRIC_ID_CHART)).toBe('chart');
  });
  it('should return results view for metric results routes', () => {
    expect(getFileViewFromRoute(BusterRoutes.APP_METRIC_ID_RESULTS)).toBe('results');
    expect(getFileViewFromRoute(BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS)).toBe('results');
  });

  it('should return dashboard view for dashboard routes', () => {
    expect(getFileViewFromRoute(BusterRoutes.APP_CHAT_ID_DASHBOARD_ID)).toBe('dashboard');
    expect(getFileViewFromRoute(BusterRoutes.APP_DASHBOARD_ID)).toBe('dashboard');
  });

  it('should return undefined for routes not in the mapping', () => {
    // @ts-expect-error Testing with an invalid route
    expect(getFileViewFromRoute('INVALID_ROUTE')).toBeUndefined();
  });
  it('type safety - should accept only BusterRoutes enum values', () => {
    // This test is mainly for TypeScript compilation - it should error if we try to pass invalid types
    const validRoute = BusterRoutes.APP_DASHBOARD_ID;
    expect(() => getFileViewFromRoute(validRoute)).not.toThrow();
  });
});
