import { ShareAssetType } from '@/api/asset_interfaces/share';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites
} from '@/api/buster_rest/users';
import { act, renderHook } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

// Mock the hooks
jest.mock('@/api/buster_rest/users', () => ({
  useGetUserFavorites: jest.fn(),
  useUpdateUserFavorites: jest.fn(),
  useDeleteUserFavorite: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn()
}));

// Do not mock useMemoizedFn to use the real implementation

describe('useFavoriteSidebarPanel', () => {
  const mockFavorites = [
    { id: 'metric1', name: 'Metric 1', asset_type: ShareAssetType.METRIC },
    { id: 'dashboard1', name: 'Dashboard 1', asset_type: ShareAssetType.DASHBOARD },
    { id: 'chat1', name: 'Chat 1', asset_type: ShareAssetType.CHAT },
    { id: 'collection1', name: 'Collection 1', asset_type: ShareAssetType.COLLECTION }
  ];

  const mockUpdateFavorites = jest.fn();
  const mockDeleteFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useGetUserFavorites as jest.Mock).mockReturnValue({
      data: mockFavorites
    });

    (useUpdateUserFavorites as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateFavorites
    });

    (useDeleteUserFavorite as jest.Mock).mockReturnValue({
      mutateAsync: mockDeleteFavorite
    });

    (useParams as jest.Mock).mockReturnValue({
      chatId: undefined,
      metricId: undefined,
      dashboardId: undefined,
      collectionId: undefined
    });
  });

  test('should return correct initial structure', () => {
    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current).toHaveProperty('favoritesDropdownItems');
    expect(result.current).toHaveProperty('favoritedPageType');
  });

  test('should call updateUserFavorites when onFavoritesReorder is called', () => {
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

  test('should correctly identify active chat asset', () => {
    (useParams as jest.Mock).mockReturnValue({
      chatId: 'chat1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    const chatItem = result.current.favoritesDropdownItems?.items.find(
      (item) => item.id === 'chat1'
    );

    expect(chatItem?.active).toBe(true);
  });

  test('should correctly identify active metric asset', () => {
    (useParams as jest.Mock).mockReturnValue({
      metricId: 'metric1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    const metricItem = result.current.favoritesDropdownItems?.items.find(
      (item) => item.id === 'metric1'
    );

    expect(metricItem?.active).toBe(true);
  });

  test('should set favoritedPageType to METRIC when metricId is in favorites', () => {
    (useParams as jest.Mock).mockReturnValue({
      metricId: 'metric1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritedPageType).toBe(ShareAssetType.METRIC);
  });

  test('should set favoritedPageType to null when page is not favorited', () => {
    (useParams as jest.Mock).mockReturnValue({
      metricId: 'nonexistent'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritedPageType).toBe(null);
  });

  test('should return null for favoritesDropdownItems when no favorites exist', () => {
    (useGetUserFavorites as jest.Mock).mockReturnValue({
      data: []
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritesDropdownItems).toBe(null);
  });

  test('should call deleteUserFavorite when item removal is triggered', () => {
    const { result } = renderHook(() => useFavoriteSidebarPanel());

    act(() => {
      const firstItem = result.current.favoritesDropdownItems?.items[0];
      if (firstItem?.onRemove) {
        firstItem.onRemove();
      }
    });

    expect(mockDeleteFavorite).toHaveBeenCalledWith(['metric1']);
  });

  test('should set favoritedPageType to null when chatId and another param exist', () => {
    (useParams as jest.Mock).mockReturnValue({
      chatId: 'chat1',
      metricId: 'metric1'
    });

    const { result } = renderHook(() => useFavoriteSidebarPanel());

    expect(result.current.favoritedPageType).toBe(null);
  });
});
