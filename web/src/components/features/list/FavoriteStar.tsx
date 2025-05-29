import type { ShareAssetType } from '@/api/asset_interfaces';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites
} from '@/api/buster_rest/users';
import { Button } from '@/components/ui/buttons';
import { Star } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { cva } from 'class-variance-authority';
import React, { useMemo } from 'react';

const favoriteStarVariants = cva('transition-colors', {
  variants: {
    variant: {
      default: 'text-icon-color hover:text-foreground',
      tertiary: 'text-text-tertiary hover:text-icon-color'
    },
    isFavorited: {
      true: 'text-yellow-500! hover:text-yellow-500!',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'default',
    isFavorited: false
  }
});

export const FavoriteStar: React.FC<{
  id: string;
  type: ShareAssetType;
  title: string;
  className?: string;
  iconStyle?: 'default' | 'tertiary';
}> = React.memo(({ title: name, id, type, className = '', iconStyle = 'default' }) => {
  const { isFavorited, onFavoriteClick } = useFavoriteStar({ id, type, name });

  const tooltipText = isFavorited ? 'Remove from favorites' : 'Add to favorites';

  return (
    <AppTooltip title={tooltipText} key={tooltipText}>
      <Button
        className={cn('flex transition-none', isFavorited && 'opacity-100!', className)}
        onClick={onFavoriteClick}
        variant="ghost"
        prefix={
          <div
            className={cn(
              favoriteStarVariants({
                variant: iconStyle === 'tertiary' ? 'tertiary' : 'default',
                isFavorited
              })
            )}>
            {isFavorited ? <StarFilled /> : <Star />}
          </div>
        }
      />
    </AppTooltip>
  );
});
FavoriteStar.displayName = 'FavoriteStar';

export const useFavoriteStar = ({
  id,
  type,
  name
}: {
  id: string;
  type: ShareAssetType;
  name: string;
}) => {
  const { data: userFavorites } = useGetUserFavorites();
  const { mutateAsync: removeItemFromFavorite } = useDeleteUserFavorite();
  const { mutateAsync: addItemToFavorite } = useAddUserFavorite();

  const isFavorited = useMemo(() => {
    return userFavorites?.some((favorite) => favorite.id === id);
  }, [userFavorites, id]);

  const onFavoriteClick = useMemoizedFn(async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!isFavorited) {
      return await addItemToFavorite([
        {
          asset_type: type,
          id,
          name
        }
      ]);
    }

    return await removeItemFromFavorite([id]);
  });

  return useMemo(
    () => ({
      isFavorited,
      onFavoriteClick
    }),
    [isFavorited, onFavoriteClick]
  );
};
