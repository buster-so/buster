import { useGetCollection } from '@/api/buster_rest/collections';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useGetAsset } from './useGetAsset';

// Mock the dependencies
jest.mock('@/api/buster_rest/metrics', () => ({
  useGetMetric: jest.fn(),
  useGetMetricData: jest.fn()
}));

jest.mock('@/api/buster_rest/dashboards', () => ({
  useGetDashboard: jest.fn()
}));

jest.mock('@/api/buster_rest/collections', () => ({
  useGetCollection: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn()
}));

describe('useGetAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (useGetMetric as jest.Mock).mockReturnValue({ error: null, isFetched: true });
    (useGetMetricData as jest.Mock).mockReturnValue({ isFetched: true });
    (useGetDashboard as jest.Mock).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });
    (useGetCollection as jest.Mock).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });
  });

  test('should properly handle metric asset type', () => {
    (useGetMetric as jest.Mock).mockReturnValue({ error: null, isFetched: true });
    (useGetMetricData as jest.Mock).mockReturnValue({ isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(useGetMetric).toHaveBeenCalledWith(
      { id: 'metric-123', versionNumber: undefined },
      { enabled: true }
    );
    expect(useGetMetricData).toHaveBeenCalledWith({ id: 'metric-123', versionNumber: undefined });
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false
    });
  });

  test('should properly handle dashboard asset type', () => {
    (useGetDashboard as jest.Mock).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'dashboard-123', type: 'dashboard' })
    );

    expect(useGetDashboard).toHaveBeenCalledWith(
      { id: 'dashboard-123', versionNumber: undefined },
      { enabled: true }
    );
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false
    });
  });

  test('should properly handle collection asset type', () => {
    (useGetCollection as jest.Mock).mockReturnValue({
      error: null,
      isFetched: true,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'collection-123', type: 'collection' })
    );

    expect(useGetCollection).toHaveBeenCalledWith('collection-123');
    expect(result.current).toEqual({
      isFetched: true,
      error: null,
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      showLoader: false
    });
  });

  test('should use version number from props if provided', () => {
    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'metric-123', type: 'metric', versionNumber: 42 })
    );

    expect(useGetMetric).toHaveBeenCalledWith(
      { id: 'metric-123', versionNumber: 42 },
      { enabled: true }
    );
  });

  test('should use version number from search params if not provided in props', () => {
    const mockSearchParams = new URLSearchParams({
      metric_version_number: '42'
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(useGetMetric).toHaveBeenCalledWith(
      { id: 'metric-123', versionNumber: 42 },
      { enabled: true }
    );
  });

  test('should handle password required error (418)', () => {
    const passwordError = { status: 418, message: 'Password required' };
    (useGetMetric as jest.Mock).mockReturnValue({ error: passwordError, isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current).toEqual({
      isFetched: true,
      error: passwordError,
      hasAccess: false,
      passwordRequired: true,
      isPublic: true,
      showLoader: false
    });
  });

  test('should handle deleted asset error (410)', () => {
    const deletedError = { status: 410, message: 'Asset deleted' };
    (useGetMetric as jest.Mock).mockReturnValue({ error: deletedError, isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current).toEqual({
      isFetched: true,
      error: deletedError,
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      showLoader: false
    });
  });

  test('should handle other errors', () => {
    const otherError = { status: 500, message: 'Server error' };
    (useGetMetric as jest.Mock).mockReturnValue({ error: otherError, isFetched: true });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current).toEqual({
      isFetched: true,
      error: otherError,
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      showLoader: false
    });
  });

  test('should show loader for metrics when data is loading', () => {
    (useGetMetric as jest.Mock).mockReturnValue({ error: null, isFetched: false });
    (useGetMetricData as jest.Mock).mockReturnValue({ isFetched: false });

    const { result } = renderHook(() => useGetAsset({ assetId: 'metric-123', type: 'metric' }));

    expect(result.current.showLoader).toBe(true);
  });

  test('should show loader for dashboards when data is loading', () => {
    (useGetDashboard as jest.Mock).mockReturnValue({
      error: null,
      isFetched: false,
      isError: false
    });

    const { result } = renderHook(() =>
      useGetAsset({ assetId: 'dashboard-123', type: 'dashboard' })
    );

    expect(result.current.showLoader).toBe(true);
  });

  test('should show loader for collections when data is loading', () => {
    (useGetCollection as jest.Mock).mockReturnValue({
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
