import type { BusterUserFavorite } from '@/api/asset_interfaces/users';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import { assetTypeToIcon, assetTypeToRoute } from '../config/assetIcons';
import { useMemoizedFn } from '@/hooks';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites
} from '@/api/buster_rest/users';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ShareAssetType } from '@/api/asset_interfaces/share';

export const useFavoriteSidebarPanel = () => {
  const { data: favorites } = useGetUserFavorites();
  const { mutateAsync: updateUserFavorites } = useUpdateUserFavorites();
  const { mutateAsync: deleteUserFavorite } = useDeleteUserFavorite();

  const { chatId, metricId, dashboardId, collectionId } = useParams() as {
    chatId: string | undefined;
    metricId: string | undefined;
    dashboardId: string | undefined;
    collectionId: string | undefined;
  };

  const onFavoritesReorder = useMemoizedFn((itemIds: string[]) => {
    updateUserFavorites(itemIds);
  });

  const isAssetActive = useMemoizedFn((favorite: BusterUserFavorite) => {
    const assetType = favorite.asset_type;
    const id = favorite.id;

    switch (assetType) {
      case ShareAssetType.CHAT:
        return id === chatId;
      case ShareAssetType.METRIC:
        return id === metricId;
      case ShareAssetType.DASHBOARD:
        return id === dashboardId;
      case ShareAssetType.COLLECTION:
        return id === collectionId;
      default: {
        const _exhaustiveCheck: never = assetType;
        return false;
      }
    }
  });

  const favoritedPageType: ShareAssetType | null = useMemo(() => {
    if (chatId && (metricId || dashboardId || collectionId)) {
      return null;
    }

    if (chatId && favorites.some((f) => f.id === chatId)) {
      return ShareAssetType.CHAT;
    }

    if (metricId && favorites.some((f) => f.id === metricId)) {
      return ShareAssetType.METRIC;
    }

    if (dashboardId && favorites.some((f) => f.id === dashboardId)) {
      return ShareAssetType.DASHBOARD;
    }

    if (collectionId && favorites.some((f) => f.id === collectionId)) {
      return ShareAssetType.COLLECTION;
    }

    return null;
  }, [favorites, chatId, metricId, dashboardId, collectionId]);

  const favoritesDropdownItems: ISidebarGroup | null = useMemo(() => {
    if (!favorites || favorites.length === 0) return null;

    return {
      label: 'Favorites',
      id: 'favorites',
      isSortable: true,
      onItemsReorder: onFavoritesReorder,
      items: favorites.map((favorite) => {
        const Icon = assetTypeToIcon(favorite.asset_type);
        const route = assetTypeToRoute(favorite.asset_type, favorite.id);
        return {
          label: favorite.name,
          icon: <Icon />,
          route,
          active: isAssetActive(favorite),
          id: favorite.id,
          onRemove: () => deleteUserFavorite([favorite.id])
        };
      })
    } satisfies ISidebarGroup;
  }, [
    favorites,
    deleteUserFavorite,
    onFavoritesReorder,
    isAssetActive,
    chatId,
    metricId,
    dashboardId,
    collectionId
  ]);

  return { favoritesDropdownItems, favoritedPageType };
};
