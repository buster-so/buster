import { ShareAssetType } from '@/api/asset_interfaces/share';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites
} from '@/api/buster_rest/users';
import { act, renderHook } from '@testing-library/react';
import { useParams } from 'next/navigation';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

// Mock the hooks
vi.mock('@/api/buster_rest/users', () => ({
  useGetUserFavorites: vi.fn(),
  useUpdateUserFavorites: vi.fn(),
  useDeleteUserFavorite: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn()
}));

// Do not mock useMemoizedFn to use the real implementation

describe('useFavoriteSidebarPanel', () => {
  const mockFavorites = [
    { id: 'metric1', name: 'Metric 1', asset_type: ShareAssetType.METRIC },
    { id: 'dashboard1', name: 'Dashboard 1', asset_type: ShareAssetType.DASHBOARD },
    { id: 'chat1', name: 'Chat 1', asset_type: ShareAssetType.CHAT },
    { id: 'collection1', name: 'Collection 1', asset_type: ShareAssetType.COLLECTION }
  ];

  const mockUpdateFavorites = vi.fn();
  const mockDeleteFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useGetUserFavorites as any).mockReturnValue({
      data: mockFavorites
    });

    (useUpdateUserFavorites as any).mockReturnValue({
      mutateAsync: mockUpdateFavorites
    });

    (useDeleteUserFavorite as any).mockReturnValue({
      mutateAsync: mockDeleteFavorite
    });

    (useParams as any).mockReturnValue({
      chatId: undefined,
      metricId: undefined,
      dashboardId: undefined,
      collectionId: undefined
    });
  });
  it('should return correct initial structure', () => {
    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current).toHaveProperty('favoritesDropdownItems');
    expect(result.current).toHaveProperty('favoritedPageType');
  });
  it('should call updateUserFavorites when onFavoritesReorder is called', () => {
    const { result } = renderHook(() => useFavoriteSidebarPanel());
    const itemIds = ['metric1', 'dashboard1'];

    act(() => {
      const onItemsReorder = result.current.favoritesDropdownItems?.onItemsReorder;
      if (onItemsReorder) {
        onItemsReorder(itemIds);
      }
    });

    expect(mockUpdateFavorites).toHaveBeenCalledWith(itemIds);
  });
  it('should correctly identify active chat asset', () => {
    (useParams as any).mockReturnValue({
      chatId: 'chat1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    const chatItem = result.current.favoritesDropdownItems?.items.find(
      (item) => item.id === 'chat1'
    );

    expect(chatItem?.active).toBe(true);
  });
  it('should correctly identify active metric asset', () => {
    (useParams as any).mockReturnValue({
      metricId: 'metric1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    const metricItem = result.current.favoritesDropdownItems?.items.find(
      (item) => item.id === 'metric1'
    );

    expect(metricItem?.active).toBe(true);
  });
  it('should set favoritedPageType to METRIC when metricId is in favorites', () => {
    (useParams as any).mockReturnValue({
      metricId: 'metric1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritedPageType).toBe(ShareAssetType.METRIC);
  });
  it('should set favoritedPageType to null when page is not favorited', () => {
    (useParams as any).mockReturnValue({
      metricId: 'nonexistent'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritedPageType).toBe(null);
  });
  it('should return null for favoritesDropdownItems when no favorites exist', () => {
    (useGetUserFavorites as any).mockReturnValue({
      data: []
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritesDropdownItems).toBe(null);
  });
  it('should call deleteUserFavorite when item removal is triggered', () => {
    const { result } = renderHook(() => useFavoriteSidebarPanel());

    act(() => {
      const firstItem = result.current.favoritesDropdownItems?.items[0];
      if (firstItem?.onRemove) {
        firstItem.onRemove();
      }
    });

    expect(mockDeleteFavorite).toHaveBeenCalledWith(['metric1']);
  });
  it('should set favoritedPageType to null when chatId and another param exist', () => {
    (useParams as any).mockReturnValue({
      chatId: 'chat1',
      metricId: 'metric1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritedPageType).toBe(null);
  });
});
