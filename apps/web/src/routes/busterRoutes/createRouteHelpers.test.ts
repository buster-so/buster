import { describe, expect, it } from 'vitest';
import type { DashboardFileViewSecondary, MetricFileViewSecondary } from '@/layouts/ChatLayout';
import { BusterAppRoutes } from './busterAppRoutes';
import { BusterAuthRoutes } from './busterAuthRoutes';
import { BusterRoutes } from './busterRoutes';
import { BusterSettingsRoutes } from './busterSettingsRoutes';
import {
  createBusterRoute,
  createPathnameToBusterRoute,
  extractPathParamsFromRoute
} from './createRouteHelpers';

describe('createBusterRoute', () => {
  it('should return route as is when no parameters are provided', () => {
    const input = { route: BusterAuthRoutes.AUTH_LOGIN };
    const result = createBusterRoute(input);
    expect(result).toBe('/auth/login');
  });
  it('should replace single dynamic parameter in route', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID,
      chatId: '123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/123');
  });
  it('should replace multiple dynamic parameters in route', () => {
    const input = {
      route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS,
      permissionGroupId: 'group123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/settings/permission-groups/group123/datasets');
  });
  it('should handle routes with multiple path parameters but no query', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID_CHART,
      chatId: 'chat123',
      metricId: 'metric456'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/chat123/metrics/metric456/chart');
  });
  it('should handle routes with nested path parameters', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
      chatId: 'chat789',
      metricId: 'metric012'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/chat789/metrics/metric012/results');
  });
  it('should preserve path structure with multiple segments', () => {
    const input = {
      route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW,
      datasetId: 'dataset123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/datasets/dataset123/permissions/overview');
  });
  it('should handle routes with query parameters', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID_CHART,
      chatId: 'chat123',
      metricId: 'metric456',
      secondaryView: 'chart-edit' as MetricFileViewSecondary
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/chat123/metrics/metric456/chart?secondary_view=chart-edit');

    const input2 = {
      route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID_CHART,
      chatId: 'chat123',
      metricId: 'metric456',
      secondaryView: 'sql-edit' as MetricFileViewSecondary
    } as const;
    const result2 = createBusterRoute(input2);
    expect(result2).toBe('/app/chats/chat123/metrics/metric456/chart?secondary_view=sql-edit');

    const input3 = {
      route: BusterAppRoutes.APP_METRIC_ID_CHART,
      metricId: 'metric456',
      secondaryView: undefined
    } as const;
    const result3 = createBusterRoute(input3);
    expect(result3).toBe('/app/metrics/metric456/chart');

    const input4 = {
      route: BusterAppRoutes.APP_METRIC_ID_CHART,
      metricId: 'metric456',
      secondaryView: 'chart-edit' as MetricFileViewSecondary
    } as const;
    const result4 = createBusterRoute(input4);
    expect(result4).toBe('/app/metrics/metric456/chart?secondary_view=chart-edit');
  });

  it('createBusterRoute should handle version history secondary view', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
      chatId: 'chat123',
      dashboardId: 'dashboard456',
      versionNumber: 1,
      secondaryView: 'version-history' as DashboardFileViewSecondary
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe(
      '/app/chats/chat123/dashboards/dashboard456?dashboard_version_number=1&secondary_view=version-history'
    );

    const input2 = {
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
      dashboardId: 'dashboard456',
      versionNumber: 1,
      chatId: 'chat123',
      secondaryView: 'version-history'
    } as const;
    const result2 = createBusterRoute(input2);
    expect(result2).toBe(
      '/app/chats/chat123/dashboards/dashboard456?dashboard_version_number=1&secondary_view=version-history'
    );
  });
});

describe('createPathnameToBusterRoute', () => {
  it('should convert simple auth route pathname', () => {
    const pathname = '/auth/login';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAuthRoutes.AUTH_LOGIN);
  });
  it('should convert chat route with dynamic chatId', () => {
    const pathname = '/app/chats/123';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAppRoutes.APP_CHAT_ID);
  });
  it('should convert settings route with permission group id', () => {
    const pathname = '/app/settings/permission-groups/group123/datasets';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS);
  });
  it('should convert dataset route with ID', () => {
    const pathname = '/app/datasets/dataset123';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.APP_DATASETS_ID);
  });
  it('should convert dataset permissions route', () => {
    const pathname = '/app/datasets/dataset123/permissions/overview';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW);
  });
  it('should convert settings user route with nested path', () => {
    const pathname = '/app/settings/users/user123/permission-groups';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterSettingsRoutes.SETTINGS_USERS_ID_PERMISSION_GROUPS);
  });
  it('should fallback to ROOT for unmatched routes', () => {
    const pathname = '/invalid/route/path';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.ROOT);
  });
  it('should handle routes with query parameters', () => {
    const pathname = '/app/chats/123/metrics/metric456/chart?side_panel=chart-edit';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAppRoutes.APP_CHAT_ID_METRIC_ID_CHART);
  });
});

describe('extractPathParamsFromRoute', () => {
  it('should extract single parameter from route', () => {
    const route = '/app/collections/123';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({
      collectionId: '123'
    });
  });
  it('should extract multiple parameters from route', () => {
    const route = '/app/chats/chat123/metrics/metric456/chart';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({
      chatId: 'chat123',
      metricId: 'metric456'
    });
  });
  it('should handle query parameters', () => {
    const route = '/app/metrics/metric123/chart?secondary_view=chart-edit';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({
      metricId: 'metric123',
      secondaryView: 'chart-edit'
    });
  });
  it('should handle multiple query parameters', () => {
    const route =
      '/app/chats/chat123/dashboards/dash456?dashboard_version_number=1&secondary_view=version-history';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({
      chatId: 'chat123',
      dashboardId: 'dash456',
      secondaryView: 'version-history',
      versionNumber: '1'
    });
  });
  it('should return empty object for non-matching routes', () => {
    const route = '/invalid/route/path';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({});
  });
  it('should handle settings routes with nested parameters', () => {
    const route = '/app/settings/permission-groups/group123/datasets';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({
      permissionGroupId: 'group123'
    });
  });
  it('should handle dataset routes with permissions', () => {
    const route = '/app/datasets/dataset123/permissions/overview';
    const result = extractPathParamsFromRoute(route);
    expect(result).toEqual({
      datasetId: 'dataset123'
    });
  });
});
