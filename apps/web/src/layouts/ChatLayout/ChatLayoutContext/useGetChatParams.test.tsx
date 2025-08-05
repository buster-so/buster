import { renderHook } from '@testing-library/react';
import * as navigation from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as appLayout from '@/context/BusterAppLayout';
import { useGetChatParams } from './useGetChatParams';

// Mock the required hooks and modules
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn()
  })),
  usePathname: vi.fn()
}));

vi.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: vi.fn()
}));

describe('useGetChatParams', () => {
  const mockUseParams = navigation.useParams as any;
  const mockUseSearchParams = navigation.useSearchParams as any;
  const mockUseAppLayoutContextSelector = appLayout.useAppLayoutContextSelector as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockImplementation(() => ({
      get: vi.fn().mockReturnValue(null)
    }));
    mockUseAppLayoutContextSelector.mockReturnValue('default-route');
    (navigation.usePathname as any).mockReturnValue('/');
  });
  it('returns undefined values when no params are provided', () => {
    mockUseParams.mockReturnValue({});

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current).toEqual({
      isVersionHistoryMode: false,
      chatId: undefined,
      metricId: undefined,
      dashboardId: undefined,
      collectionId: undefined,
      datasetId: undefined,
      messageId: undefined,
      metricVersionNumber: undefined,
      dashboardVersionNumber: undefined,
      currentRoute: '/',
      secondaryView: null
    });
  });
  it('correctly processes chat and message IDs', () => {
    mockUseParams.mockReturnValue({
      chatId: 'chat-123',
      messageId: 'msg-456'
    });

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.chatId).toBe('chat-123');
    expect(result.current.messageId).toBe('msg-456');
  });

  it('handles metric version number from query parameter', () => {
    mockUseParams.mockReturnValue({
      metricId: 'metric-123'
    });
    mockUseSearchParams.mockImplementation(() => ({
      get: (param: string) => (param === 'metric_version_number' ? '43' : null)
    }));

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.metricVersionNumber).toBe(43);
  });

  it('handles dashboard version number from query parameter', () => {
    mockUseParams.mockReturnValue({
      dashboardId: 'dashboard-123'
    });
    mockUseSearchParams.mockImplementation(() => ({
      get: (param: string) => (param === 'dashboard_version_number' ? '45' : null)
    }));

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.dashboardVersionNumber).toBe(45);
  });
  it('correctly identifies version history mode', () => {
    mockUseSearchParams.mockImplementation(() => ({
      get: (param: string) => (param === 'secondary_view' ? 'version-history' : null)
    }));

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.isVersionHistoryMode).toBe(true);
  });
  it('handles collection and dataset IDs', () => {
    mockUseParams.mockReturnValue({
      collectionId: 'collection-123',
      datasetId: 'dataset-456'
    });

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.collectionId).toBe('collection-123');
    expect(result.current.datasetId).toBe('dataset-456');
  });
  it('returns consistent values on multiple renders without param changes', () => {
    mockUseParams.mockReturnValue({
      chatId: 'chat-123',
      metricId: 'metric-123',
      versionNumber: '46'
    });

    const { result, rerender } = renderHook(() => useGetChatParams());
    const firstRender = result.current;

    rerender();

    expect(result.current).toEqual(firstRender);
  });
});
