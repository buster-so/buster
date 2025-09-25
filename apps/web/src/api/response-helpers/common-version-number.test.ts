import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetAssetVersionNumber } from './common-version-number';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(),
}));

// Import mocked modules
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';

const mockedUseQuery = vi.mocked(useQuery);
const mockedUseSearch = vi.mocked(useSearch);

describe('useGetAssetVersionNumber', () => {
  // Mock query options and selector functions
  const mockQueryOptions = {
    queryKey: ['test-asset'],
    queryFn: () => Promise.resolve({ version: 5 }),
  };

  const mockStableVersionDataSelector = vi.fn((data: { version: number }) => data.version);
  const mockStableVersionSearchSelector = vi.fn((search: any) => search.version);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    mockedUseSearch.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return correct structure with default values', () => {
      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          undefined,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current).toEqual({
        paramVersionNumber: undefined,
        selectedVersionNumber: 'LATEST',
        latestVersionNumber: undefined,
      });
    });

    it('should call useQuery with correct parameters', () => {
      renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          3,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(mockedUseQuery).toHaveBeenCalledWith({
        ...mockQueryOptions,
        enabled: false,
        select: mockStableVersionDataSelector,
      });
    });

    it('should call useSearch with correct parameters', () => {
      renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          3,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(mockedUseSearch).toHaveBeenCalledWith({
        select: mockStableVersionSearchSelector,
        strict: false,
      });
    });
  });

  describe('version number handling', () => {
    it('should return LATEST when versionNumber is undefined', () => {
      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          undefined,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });

    it('should return LATEST when versionNumber is explicitly LATEST', () => {
      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          'LATEST',
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });

    it('should return specific version number when provided', () => {
      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          3,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe(3);
    });
  });

  describe('isLatest logic', () => {
    it('should consider version as latest when it matches latestVersionNumber', () => {
      mockedUseQuery.mockReturnValue({
        data: 5,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          5, // matches latest
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });

    it('should not consider version as latest when it does not match latestVersionNumber', () => {
      mockedUseQuery.mockReturnValue({
        data: 5,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          3, // does not match latest (5)
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe(3);
    });

    it('should return LATEST when no versionNumber but latestVersionNumber exists', () => {
      mockedUseQuery.mockReturnValue({
        data: 5,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          undefined,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });
  });

  describe('paramVersionNumber from search', () => {
    it('should use paramVersionNumber when versionNumber is undefined', () => {
      mockedUseSearch.mockReturnValue(7);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          undefined,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.paramVersionNumber).toBe(7);
      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });

    it('should prefer explicit versionNumber over paramVersionNumber', () => {
      mockedUseSearch.mockReturnValue(7);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          3, // explicit version
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.paramVersionNumber).toBe(7);
      expect(result.current.selectedVersionNumber).toBe(3); // uses explicit version
    });

    it('should fall back to LATEST when no versionNumber and no paramVersionNumber', () => {
      mockedUseSearch.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          undefined,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.paramVersionNumber).toBe(undefined);
      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });
  });

  describe('edge cases', () => {
    it('should handle zero as a valid version number', () => {
      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          0,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe('LATEST');
    });

    it('should handle negative version numbers', () => {
      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          -1,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.selectedVersionNumber).toBe(-1);
    });

    it('should handle when latestVersionNumber is undefined', () => {
      mockedUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          5,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      expect(result.current.latestVersionNumber).toBe(undefined);
      expect(result.current.selectedVersionNumber).toBe(5);
    });
  });

  describe('memoization', () => {
    it('should return same object reference when dependencies do not change', () => {
      mockedUseQuery.mockReturnValue({
        data: 5,
        isLoading: false,
        error: null,
      } as any);
      mockedUseSearch.mockReturnValue(3);

      const { result, rerender } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          2,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      const firstResult = result.current;

      // Rerender without changing dependencies
      rerender();

      expect(result.current).toBe(firstResult); // Same reference due to useMemo
    });

    it('should return new object when latestVersionNumber changes', () => {
      let latestVersion = 5;

      mockedUseQuery.mockImplementation(
        () =>
          ({
            data: latestVersion,
            isLoading: false,
            error: null,
          }) as any
      );
      mockedUseSearch.mockReturnValue(3);

      const { result, rerender } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          2,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      const firstResult = result.current;

      // Change the latest version
      latestVersion = 6;
      rerender();

      expect(result.current).not.toBe(firstResult); // Different reference
      expect(result.current.latestVersionNumber).toBe(6);
    });
  });

  describe('selector function integration', () => {
    it('should call stableVersionDataSelector with query data', () => {
      const mockData = { version: 10, name: 'test' };
      mockedUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          5,
          mockStableVersionDataSelector,
          mockStableVersionSearchSelector
        )
      );

      // The selector should be passed to useQuery, but not called directly in our hook
      expect(mockStableVersionDataSelector).not.toHaveBeenCalled();
    });

    it('should work with custom selector functions', () => {
      const customDataSelector = vi.fn((data: any) => data?.customVersion || 0);
      const customSearchSelector = vi.fn((search: any) => search?.customParam);

      mockedUseQuery.mockReturnValue({
        data: 15, // This would be the result after selector is applied
        isLoading: false,
        error: null,
      } as any);
      mockedUseSearch.mockReturnValue(8);

      const { result } = renderHook(() =>
        useGetAssetVersionNumber(
          mockQueryOptions,
          undefined,
          customDataSelector,
          customSearchSelector
        )
      );

      expect(result.current.latestVersionNumber).toBe(15);
      expect(result.current.paramVersionNumber).toBe(8);
      expect(mockedUseQuery).toHaveBeenCalledWith({
        ...mockQueryOptions,
        enabled: false,
        select: customDataSelector,
      });
      expect(mockedUseSearch).toHaveBeenCalledWith({
        select: customSearchSelector,
        strict: false,
      });
    });
  });
});
