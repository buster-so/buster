import { useMemo } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';
import { ShareRight } from '@/components/ui/icons';
import type { MenuItem } from '@/components/ui/menu-shared';
import { getIsEffectiveOwner } from '@/lib/share';
import { createFavoriteMenuItem, useFavoriteStar } from '../favorites';
import { getShareAssetConfig, ShareMenuContent } from '../ShareMenu';

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
    return createFavoriteMenuItem({
      isFavorited,
      onFavoriteClick,
    });
  }, [isFavorited, onFavoriteClick]);
};

export const useCollectionShareMenuSelectMenu = ({
  collectionId,
}: {
  collectionId: string;
}): MenuItem => {
  const { data: shareAssetConfig } = useGetCollection(collectionId, {
    select: getShareAssetConfig,
  });
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
      label: 'Share',
      value: 'share-report',
      icon: <ShareRight />,
      disabled: !isEffectiveOwner,
      items:
        isEffectiveOwner && shareAssetConfig
          ? [
              <ShareMenuContent
                key={collectionId}
                shareAssetConfig={shareAssetConfig}
                assetId={collectionId}
                assetType={'collection'}
              />,
            ]
          : undefined,
    }),
    [collectionId, shareAssetConfig, isEffectiveOwner]
  );
};
