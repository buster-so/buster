import { Star } from '@/components/ui/icons';
import { StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import type { MenuItem } from '@/components/ui/menu-shared';

/**
 * Creates a standardized favorite menu item for use in three-dot menus
 *
 * @param params - Configuration for the favorite menu item
 * @param params.isFavorited - Whether the item is currently favorited
 * @param params.onFavoriteClick - Handler function to toggle favorite state
 * @returns MenuItem object configured for favorite functionality
 *
 * @example
 * ```tsx
 * const { isFavorited, onFavoriteClick } = useFavoriteStar({
 *   id: reportId,
 *   type: 'report_file',
 *   name: reportName
 * });
 *
 * const favoriteMenuItem = createFavoriteMenuItem({
 *   isFavorited,
 *   onFavoriteClick
 * });
 * ```
 */
export function createFavoriteMenuItem({
  isFavorited,
  onFavoriteClick,
}: {
  isFavorited: boolean;
  onFavoriteClick: () => void;
}): MenuItem {
  return {
    value: 'favorite',
    label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
    icon: isFavorited ? <StarFilled /> : <Star />,
    onClick: () => onFavoriteClick(),
    closeOnSelect: false,
  };
}
