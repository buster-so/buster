import { useMemo } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';
import { Star } from '@/components/ui/icons';
import { StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { createMenuItem, type MenuItem } from '@/components/ui/menu-shared';
import { useFavoriteStar } from '../favorites';

export const useFavoriteCollectionSelectMenu = ({
  collectionId,
}: {
  collectionId: string;
}): MenuItem => {
  const { data: name } = useGetCollection(collectionId, { select: (data) => data?.name });
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: collectionId,
    type: 'collection',
    name: name || '',
  });

  return useMemo(() => {
    return createMenuItem({
      value: 'favorite',
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      icon: isFavorited ? <StarFilled /> : <Star />,
      onClick: () => onFavoriteClick(),
      closeOnSelect: false,
    });
  }, [isFavorited, onFavoriteClick]);
};
