import type { FileType } from '@/api/asset_interfaces/chat';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { describe, expect, it, vi } from 'vitest';
import { assetParamsToRoute } from './assetParamsToRoute';

describe('assetParamsToRoute', () => {
  const mockChatId = 'chat123';
  const mockAssetId = 'asset123';

  // Metric tests with chatId
  it('metric with chatId and chart-edit secondary view and version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'chart-edit',
      versionNumber: 1
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId: mockChatId,
        metricId: mockAssetId,
        versionNumber: 1,
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric with chatId and chart-edit secondary view without version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'chart-edit'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: mockChatId,
        metricId: mockAssetId,
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric with chatId and sql-edit secondary view and version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      versionNumber: 1
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId: mockChatId,
        metricId: mockAssetId,
        versionNumber: 1
      })
    );
  });
  it('metric with chatId and version-history secondary view and version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      versionNumber: 1
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId: mockChatId,
        metricId: mockAssetId,
        versionNumber: 1
      })
    );
  });
  it('metric with chatId and version-history secondary view without version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'version-history'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: mockChatId,
        metricId: mockAssetId,
        secondaryView: 'version-history'
      })
    );
  });
  it('metric with chatId without secondary view and with version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      versionNumber: 1
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId: mockChatId,
        metricId: mockAssetId,
        versionNumber: 1
      })
    );
  });
  it('metric with chatId without secondary view or version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: mockChatId,
        metricId: mockAssetId
      })
    );
  });

  // Metric tests without chatId
  it('metric without chatId and chart-edit secondary view', () => {
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'chart-edit'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId: mockAssetId,
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric without chatId and version-history secondary view', () => {
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'version-history'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId: mockAssetId
      })
    );
  });
  it('metric without chatId or secondary view', () => {
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: mockAssetId,
      type: 'metric' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId: mockAssetId
      })
    );
  });

  // Dashboard tests
  it('dashboard with chatId and version-history secondary view', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'dashboard' as FileType,
      secondaryView: 'version-history'
    });

    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
        chatId: mockChatId,
        dashboardId: mockAssetId,
        secondaryView: 'version-history'
      })
    );
  });
  it('dashboard with chatId without secondary view', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'dashboard' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        chatId: mockChatId,
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
        dashboardId: mockAssetId
      })
    );
  });
  it('dashboard without chatId', () => {
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: mockAssetId,
      type: 'dashboard' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: mockAssetId
      })
    );
  });
  it('unsupported file type', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'unknown' as FileType
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Asset params to route has not been implemented for this file type',
      'unknown'
    );
    expect(result).toBe('');
    consoleSpy.mockRestore();
  });

  // Additional edge cases and combinations
  it('metric with empty chatId should behave like undefined chatId', () => {
    const result = assetParamsToRoute({
      chatId: '',
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'chart-edit'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId: mockAssetId,
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric with empty assetId should still construct route', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: '',
      type: 'metric' as FileType,
      secondaryView: 'chart-edit'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: mockChatId,
        metricId: '',
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric with very long chatId and assetId', () => {
    const longId = 'a'.repeat(100);
    const result = assetParamsToRoute({
      chatId: longId,
      assetId: longId,
      type: 'metric' as FileType,
      secondaryView: 'chart-edit'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: longId,
        metricId: longId,
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric with special characters in chatId and assetId', () => {
    const specialId = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const result = assetParamsToRoute({
      chatId: specialId,
      assetId: specialId,
      type: 'metric' as FileType,
      secondaryView: 'chart-edit'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: specialId,
        metricId: specialId,
        secondaryView: 'chart-edit'
      })
    );
  });
  it('metric with version number 0', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      versionNumber: 0
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId: mockChatId,
        metricId: mockAssetId,
        versionNumber: 0
      })
    );
  });
  it('metric with negative version number', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      versionNumber: -1
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId: mockChatId,
        metricId: mockAssetId,
        versionNumber: -1
      })
    );
  });
  it('dashboard with empty chatId should behave like undefined chatId', () => {
    const result = assetParamsToRoute({
      chatId: '',
      assetId: mockAssetId,
      type: 'dashboard' as FileType,
      secondaryView: 'version-history'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: mockAssetId,
        secondaryView: 'version-history'
      })
    );
  });
  it('dashboard with empty assetId', () => {
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: '',
      type: 'dashboard' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: ''
      })
    );
  });
  it('dashboard with very long ids', () => {
    const longId = 'a'.repeat(100);
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: longId,
      type: 'dashboard' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: longId
      })
    );
  });
  it('metric with invalid secondary view', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'metric' as FileType,
      secondaryView: 'invalid-view' as any
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
        chatId: mockChatId,
        metricId: mockAssetId
      })
    );
  });
  it('dashboard with non-version-history secondary view', () => {
    const result = assetParamsToRoute({
      assetId: mockAssetId,
      chatId: undefined,
      type: 'dashboard' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: mockAssetId
      })
    );
  });
  it('dashboard with a version history secondary view', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      versionNumber: 1,
      type: 'dashboard' as FileType,
      secondaryView: 'version-history'
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
        dashboardId: mockAssetId,
        versionNumber: 1,
        chatId: mockChatId,
        secondaryView: 'version-history'
      })
    );
  });
  it('no chat id, metric with version number', () => {
    const test = {
      assetId: '06d9d8b7-eb96-59af-9a03-0436205b60a9',
      type: 'metric',
      versionNumber: 1,
      chatId: undefined,
      secondaryView: 'version-history'
    } as const;

    const result = assetParamsToRoute(test);
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_VERSION_NUMBER,
        metricId: test.assetId,
        versionNumber: test.versionNumber,
        secondaryView: 'version-history'
      })
    );
  });
  it('no chat id, metric without version number', () => {
    const test = {
      assetId: '06d9d8b7-eb96-59af-9a03-0436205b60a9',
      type: 'metric',
      chatId: undefined
    } as any;

    const result = assetParamsToRoute(test);
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId: test.assetId
      })
    );
  });
  it('reasoning messaged with chatid', () => {
    const test = {
      assetId: '06d9d8b7-eb96-59af-9a03-0436205b60a9',
      type: 'reasoning',
      chatId: 'chat-123'
    } as const;

    const result = assetParamsToRoute(test);
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
        chatId: test.chatId,
        messageId: test.assetId
      })
    );
  });
  it('dataset route without chatId', () => {
    const result = assetParamsToRoute({
      chatId: undefined,
      assetId: mockAssetId,
      type: 'dataset' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DATASETS_ID,
        datasetId: mockAssetId
      })
    );
  });
  it('dataset route with chatId (should ignore chatId)', () => {
    const result = assetParamsToRoute({
      chatId: mockChatId,
      assetId: mockAssetId,
      type: 'dataset' as FileType
    });
    expect(result).toBe(
      createBusterRoute({
        route: BusterRoutes.APP_DATASETS_ID,
        datasetId: mockAssetId
      })
    );
  });
});
