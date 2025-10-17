import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSelectedAssetType } from './useSelectedAssetType';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
  useMatches: vi.fn(),
  useSearch: vi.fn(),
}));

import { useParams } from '@tanstack/react-router';

describe('useSelectedAssetType', () => {
  it('should return "metric_file" when metricId is present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: 'metric-123',
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('metric_file');
  });

  it('should return "reasoning" when messageId is present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: 'message-123',
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('reasoning');
  });

  it('should return "dashboard_file" when dashboardId is present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: 'dashboard-123',
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('dashboard_file');
  });

  it('should return "report_file" when reportId is present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: 'report-123',
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('report_file');
  });

  it('should return "chat" when chatId is present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: 'chat-123',
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('chat');
  });

  it('should return "collection" when collectionId is present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: 'collection-123',
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('collection');
  });

  it('should return "metric_file" as default when no params are present', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: undefined,
      collectionId: undefined,
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('metric_file');
  });

  it('should prioritize metricId over all other params', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: 'metric-123',
      dashboardId: 'dashboard-123',
      reportId: 'report-123',
      chatId: 'chat-123',
      collectionId: 'collection-123',
      messageId: 'message-123',
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('metric_file');
  });

  it('should prioritize messageId over dashboardId, reportId, chatId, and collectionId', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: 'dashboard-123',
      reportId: 'report-123',
      chatId: 'chat-123',
      collectionId: 'collection-123',
      messageId: 'message-123',
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('reasoning');
  });

  it('should prioritize dashboardId over reportId, chatId, and collectionId', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: 'dashboard-123',
      reportId: 'report-123',
      chatId: 'chat-123',
      collectionId: 'collection-123',
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('dashboard_file');
  });

  it('should prioritize reportId over chatId and collectionId', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: 'report-123',
      chatId: 'chat-123',
      collectionId: 'collection-123',
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('report_file');
  });

  it('should prioritize chatId over collectionId', () => {
    vi.mocked(useParams).mockReturnValue({
      metricId: undefined,
      dashboardId: undefined,
      reportId: undefined,
      chatId: 'chat-123',
      collectionId: 'collection-123',
      messageId: undefined,
    });

    const { result } = renderHook(() => useSelectedAssetType());

    expect(result.current).toBe('chat');
  });
});
