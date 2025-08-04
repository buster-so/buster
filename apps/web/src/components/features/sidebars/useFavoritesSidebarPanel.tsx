import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { ShareAssetType } from '@buster/server-shared/share';
import type { UserFavorite } from '@buster/server-shared/user';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites
} from '@/api/buster_rest/users';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import { useMemoizedFn } from '@/hooks';
import { assetTypeToIcon, assetTypeToRoute } from '../config/assetIcons';

export const useFavoriteSidebarPanel = () => {
  const { data: favorites } = useGetUserFavorites();
  const { mutateAsync: updateUserFavorites } = useUpdateUserFavorites();
  const { mutateAsync: deleteUserFavorite } = useDeleteUserFavorite();

  const { chatId, metricId, dashboardId, collectionId, reportId } = useParams() as {
    chatId: string | undefined;
    metricId: string | undefined;
    dashboardId: string | undefined;
    collectionId: string | undefined;
    reportId: string | undefined;
  };

  const onFavoritesReorder = useMemoizedFn((itemIds: string[]) => {
    updateUserFavorites(itemIds);
  });

  const isAssetActive = useMemoizedFn((favorite: UserFavorite) => {
    const assetType = favorite.asset_type;
    const id = favorite.id;

    switch (assetType) {
      case 'chat':
        return id === chatId;
      case 'metric':
        return id === metricId;
      case 'dashboard':
        return id === dashboardId;
      case 'collection':
        return id === collectionId;
      case 'report':
        return id === reportId;
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
      return 'chat';
    }

    if (metricId && favorites.some((f) => f.id === metricId)) {
      return 'metric';
    }

    if (dashboardId && favorites.some((f) => f.id === dashboardId)) {
      return 'dashboard';
    }

    if (collectionId && favorites.some((f) => f.id === collectionId)) {
      return 'collection';
    }

    if (reportId && favorites.some((f) => f.id === reportId)) {
      return 'report';
    }

    return null;
  }, [favorites, chatId, metricId, dashboardId, collectionId, reportId]);

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
