import { createBusterRoute, createPathnameToBusterRoute } from './createRouteHelpers';
import { BusterAuthRoutes } from './busterAuthRoutes';
import { BusterAppRoutes } from './busterAppRoutes';
import { BusterSettingsRoutes } from './busterSettingsRoutes';
import { BusterRoutes } from './busterRoutes';

describe('createBusterRoute', () => {
  test('should return route as is when no parameters are provided', () => {
    const input = { route: BusterAuthRoutes.AUTH_LOGIN };
    const result = createBusterRoute(input);
    expect(result).toBe('/auth/login');
  });

  test('should replace single dynamic parameter in route', () => {
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID,
      chatId: '123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/chats/123');
  });

  test('should replace multiple dynamic parameters in route', () => {
    const input = {
      route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS,
      permissionGroupId: 'group123'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe('/app/settings/permission-groups/group123/datasets');
  });

  test('should handle query parameters in route', () => {
    // Test with all query parameters
    const input = {
      route: BusterAppRoutes.APP_CHAT_ID_QUERY,
      chatId: '123',
      metricId: 'metric456',
      dashboardId: 'dash789',
      messageId: 'reason101'
    } as const;
    const result = createBusterRoute(input);
    expect(result).toBe(
      '/app/chats/123?metricId=metric456&dashboardId=dash789&messageId=reason101'
    );

    // Test with some undefined parameters
    const partialInput: any = {
      route: BusterAppRoutes.APP_CHAT_ID_QUERY,
      chatId: '123',
      metricId: 'metric456',
      dashboardId: undefined,
      reasoningId: null,
      yourMom: 'yourMom'
    };
    const result2 = createBusterRoute(partialInput);
    expect(result2).toBe('/app/chats/123?metricId=metric456');

    // Test with all query parameters undefined
    const minimalInput: any = {
      route: BusterAppRoutes.APP_CHAT_ID_QUERY,
      chatId: '123'
    };
    const result3 = createBusterRoute(minimalInput);
    expect(result3).toBe('/app/chats/123');
  });
});

describe('createPathnameToBusterRoute', () => {
  test('should convert simple auth route pathname', () => {
    const pathname = '/auth/login';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAuthRoutes.AUTH_LOGIN);
  });

  test('should convert chat route with dynamic chatId', () => {
    const pathname = '/app/chats/123';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAppRoutes.APP_CHAT_ID);
  });

  test('should convert settings route with permission group id', () => {
    const pathname = '/app/settings/permission-groups/group123/datasets';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS);
  });

  test('should convert chat route with query parameters', () => {
    const pathname = '/app/chats/123?metricId=metric456&dashboardId=dash789&messageId=msg101';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAppRoutes.APP_CHAT_ID_QUERY);
  });

  test('should handle partial query parameters', () => {
    const pathname = '/app/chats/123?metricId=metric456';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterAppRoutes.APP_CHAT_ID_QUERY);
  });

  test('should convert dataset route with ID', () => {
    const pathname = '/app/datasets/dataset123';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.APP_DATASETS_ID);
  });

  test('should convert dataset permissions route', () => {
    const pathname = '/app/datasets/dataset123/permissions/overview';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW);
  });

  test('should convert settings user route with nested path', () => {
    const pathname = '/app/settings/users/user123/permission-groups';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterSettingsRoutes.SETTINGS_USERS_ID_PERMISSION_GROUPS);
  });

  test('should fallback to ROOT for unmatched routes', () => {
    const pathname = '/invalid/route/path';
    const result = createPathnameToBusterRoute(pathname);
    expect(result).toEqual(BusterRoutes.ROOT);
  });
});
