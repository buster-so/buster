import * as appLayout from '@/context/BusterAppLayout';
import { renderHook } from '@testing-library/react';
import * as navigation from 'next/navigation';
import { useGetChatParams } from './useGetChatParams';

// Mock the required hooks and modules
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn()
  })),
  usePathname: jest.fn()
}));

jest.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: jest.fn()
}));

describe('useGetChatParams', () => {
  const mockUseParams = navigation.useParams as jest.Mock;
  const mockUseSearchParams = navigation.useSearchParams as jest.Mock;
  const mockUseAppLayoutContextSelector = appLayout.useAppLayoutContextSelector as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null)
    }));
    mockUseAppLayoutContextSelector.mockReturnValue('default-route');
    (navigation.usePathname as jest.Mock).mockReturnValue('/');
  });

  test('returns undefined values when no params are provided', () => {
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

  test('correctly processes chat and message IDs', () => {
    mockUseParams.mockReturnValue({
      chatId: 'chat-123',
      messageId: 'msg-456'
    });

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.chatId).toBe('chat-123');
    expect(result.current.messageId).toBe('msg-456');
  });

  test('handles metric version number from path parameter', () => {
    mockUseParams.mockReturnValue({
      metricId: 'metric-123',
      versionNumber: '42'
    });

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.metricId).toBe('metric-123');
    expect(result.current.metricVersionNumber).toBe(42);
  });

  test('handles metric version number from query parameter', () => {
    mockUseParams.mockReturnValue({
      metricId: 'metric-123'
    });
    mockUseSearchParams.mockImplementation(() => ({
      get: (param: string) => (param === 'metric_version_number' ? '43' : null)
    }));

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.metricVersionNumber).toBe(43);
  });

  test('handles dashboard version number from path parameter', () => {
    mockUseParams.mockReturnValue({
      dashboardId: 'dashboard-123',
      versionNumber: '44'
    });

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.dashboardId).toBe('dashboard-123');
    expect(result.current.dashboardVersionNumber).toBe(44);
  });

  test('handles dashboard version number from query parameter', () => {
    mockUseParams.mockReturnValue({
      dashboardId: 'dashboard-123'
    });
    mockUseSearchParams.mockImplementation(() => ({
      get: (param: string) => (param === 'dashboard_version_number' ? '45' : null)
    }));

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.dashboardVersionNumber).toBe(45);
  });

  test('correctly identifies version history mode', () => {
    mockUseSearchParams.mockImplementation(() => ({
      get: (param: string) => (param === 'secondary_view' ? 'version-history' : null)
    }));

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.isVersionHistoryMode).toBe(true);
  });

  test('handles collection and dataset IDs', () => {
    mockUseParams.mockReturnValue({
      collectionId: 'collection-123',
      datasetId: 'dataset-456'
    });

    const { result } = renderHook(() => useGetChatParams());

    expect(result.current.collectionId).toBe('collection-123');
    expect(result.current.datasetId).toBe('dataset-456');
  });

  test('returns consistent values on multiple renders without param changes', () => {
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
