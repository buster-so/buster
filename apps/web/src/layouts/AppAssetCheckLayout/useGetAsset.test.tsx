import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetCollection } from '@/api/buster_rest/collections';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useGetReport } from '@/api/buster_rest/reports';
import { useGetAsset } from './useGetAsset';

// Mock the dependencies
vi.mock('@/api/buster_rest/metrics', () => ({
  useGetMetric: vi.fn(),
  useGetMetricData: vi.fn()
}));

vi.mock('@/api/buster_rest/dashboards', () => ({
  useGetDashboard: vi.fn()
}));

vi.mock('@/api/buster_rest/collections', () => ({
  useGetCollection: vi.fn()
}));

vi.mock('@/api/buster_rest/reports', () => ({
  useGetReport: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn()
}));

describe('useGetAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useSearchParams as any).mockReturnValue(new URLSearchParams());
    (useGetMetric as any).mockReturnValue({ error: null, isFetched: true });
    (useGetMetricData as any).mockReturnValue({ isFetched: true });
    (useGetDashboard as any).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });
    (useGetCollection as any).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });
    (useGetReport as any).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false,
      data: 'Test Report'
    });
  });
  it('should properly handle metric asset type', () => {
    (useGetMetric as any).mockReturnValue({ error: null, isFetched: true });
    (useGetMetricData as any).mockReturnValue({ isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(useGetMetric).toHaveBeenCalledWith(
      { id: 'metric-123', versionNumber: undefined },
      { enabled: true, select: expect.any(Function), staleTime: Infinity }
    );
    expect(useGetMetricData).toHaveBeenCalledWith({ id: 'metric-123', versionNumber: undefined });
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false,
      title: undefined
    });
  });
  it('should properly handle dashboard asset type', () => {
    (useGetDashboard as any).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'dashboard-123', type: 'dashboard' })
    );

    expect(useGetDashboard).toHaveBeenCalledWith(
      { id: 'dashboard-123', versionNumber: undefined },
      { enabled: true, select: expect.any(Function), staleTime: Infinity }
    );
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false,
      title: undefined
    });
  });
  it('should properly handle collection asset type', () => {
    (useGetCollection as any).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'collection-123', type: 'collection' })
    );

    expect(useGetCollection).toHaveBeenCalledWith('collection-123', {
      select: expect.any(Function)
    });
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false,
      title: undefined
    });
  });

  it('should properly handle report asset type', () => {
    (useGetReport as any).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false,
      data: 'Test Report'
    });

    const { result } = renderHook(() => useGetAsset({ assetId: 'report-123', type: 'report' }));

    expect(useGetReport).toHaveBeenCalledWith(
      { reportId: 'report-123', versionNumber: undefined },
      {
        select: expect.any(Function)
      }
    );
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false,
      title: 'Test Report'
    });
  });
  it('should use version number from props if provided', () => {
    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'metric-123', type: 'metric', versionNumber: 42 })
    );

    expect(useGetMetric).toHaveBeenCalledWith(
      { id: 'metric-123', versionNumber: 42 },
      { enabled: true, select: expect.any(Function), staleTime: Infinity }
    );
  });
  it('should use version number from search params if not provided in props', () => {
    const mockSearchParams = new URLSearchParams({
      metric_version_number: '42'
    });
    (useSearchParams as any).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(useGetMetric).toHaveBeenCalledWith(
      { id: 'metric-123', versionNumber: 42 },
      { enabled: true, select: expect.any(Function), staleTime: Infinity }
    );
  });
  it('should handle password required error (418)', () => {
    const passwordError = { status: 418, message: 'Password required' };
    (useGetMetric as any).mockReturnValue({ error: passwordError, isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current).toEqual({
      isFetched: true,
      error: passwordError,
      hasAccess: false,
      passwordRequired: true,
      isPublic: true,
      showLoader: false,
      title: undefined
    });
  });
  it('should handle deleted asset error (410)', () => {
    const deletedError = { status: 410, message: 'Asset deleted' };
    (useGetMetric as any).mockReturnValue({ error: deletedError, isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current).toEqual({
      isFetched: true,
      error: deletedError,
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      showLoader: false,
      title: undefined
    });
  });
  it('should handle other errors', () => {
    const otherError = { status: 500, message: 'Server error' };
    (useGetMetric as any).mockReturnValue({ error: otherError, isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current).toEqual({
      isFetched: true,
      error: otherError,
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      showLoader: false,
      title: undefined
    });
  });
  it('should show loader for metrics when data is loading', () => {
    (useGetMetric as any).mockReturnValue({ error: null, isFetched: false });
    (useGetMetricData as any).mockReturnValue({ isFetched: false });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current.showLoader).toBe(true);
  });
  it('should show loader for dashboards when data is loading', () => {
    (useGetDashboard as any).mockReturnValue({
      error: null,
      isFetched: false,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'dashboard-123', type: 'dashboard' })
    );

    expect(result.current.showLoader).toBe(true);
  });
  it('should show loader for collections when data is loading', () => {
    (useGetCollection as any).mockReturnValue({
      error: null,
      isFetched: false,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'collection-123', type: 'collection' })
    );

    expect(result.current.showLoader).toBe(true);
  });
});
