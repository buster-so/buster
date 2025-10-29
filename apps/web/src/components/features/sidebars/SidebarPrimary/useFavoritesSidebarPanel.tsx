import { useMemo } from 'react';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites,
} from '@/api/buster_rest/users';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import Star from '@/components/ui/icons/NucleoIconOutlined/star';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { createSidebarItem } from '../../../ui/sidebar/create-sidebar-item';
import type { SidebarPrimaryProps } from './SidebarPrimary';

export const FAVORITES_SIDEBAR_ID = 'favorites';

export const useFavoriteSidebarPanel = ({
  defaultOpenFavorites = true,
}: Pick<SidebarPrimaryProps, 'defaultOpenFavorites'>): ISidebarGroup | null => {
  const { data: favorites } = useGetUserFavorites();
  const { mutateAsync: updateUserFavorites } = useUpdateUserFavorites();
  const { mutateAsync: deleteUserFavorite } = useDeleteUserFavorite();

  return useMemo(() => {
    if (!favorites || favorites.length === 0) return null;

    return {
      label: 'Favorites',
      id: FAVORITES_SIDEBAR_ID,
      icon: <Star />,
      isSortable: true,
      onItemsReorder: updateUserFavorites,
      defaultOpen: defaultOpenFavorites,
      items: favorites.map((favorite) => {
        const Icon = assetTypeToIcon(favorite.asset_type);
        const link = createSimpleAssetRoute(favorite);

        return createSidebarItem({
          label: favorite.name,
          icon: <Icon />,
          link,
          id: favorite.id,
          onRemove: () => deleteUserFavorite([favorite.id]),
        });
      }),
    } satisfies ISidebarGroup;
  }, [favorites, deleteUserFavorite]);
};
