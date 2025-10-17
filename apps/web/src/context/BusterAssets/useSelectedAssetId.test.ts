import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSelectedAssetId } from './useSelectedAssetType';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
  useMatches: vi.fn(),
  useSearch: vi.fn(),
}));

import { useParams } from '@tanstack/react-router';

describe('useSelectedAssetId', () => {
  it('should return metricId when present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: 'metric-123',
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('metric-123');
  });

  it('should return dashboardId when present and metricId is not', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: 'dashboard-456',
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('dashboard-456');
  });

  it('should return reportId when present and metricId and dashboardId are not', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: 'report-789',
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('report-789');
  });

  it('should return chatId when present and other IDs (except messageId and collectionId) are not', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: 'chat-abc',
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('chat-abc');
  });

  it('should return collectionId when present and other IDs (except messageId) are not', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: 'collection-def',
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('collection-def');
  });

  it('should return messageId when present and all other IDs are not', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: 'message-ghi',
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('message-ghi');
  });

  it('should return null when no params are present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBeNull();
  });

  it('should prioritize metricId over all other params', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: 'metric-123',
      dashboardId: 'dashboard-456',
      reportId: 'report-789',
      chatId: 'chat-abc',
      collectionId: 'collection-def',
      messageId: 'message-ghi',
    });

    const { result } = renderHook(() => useSelectedAssetId());

    expect(result.current).toBe('metric-123');
  });
});
