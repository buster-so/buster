import React from 'react';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetCollection } from '@/api/buster_rest/collections';
import { ShareMenu } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { ShareButton } from './ShareButton';

export const ShareCollectionButton = React.memo(({ collectionId }: { collectionId: string }) => {
  const { data: collectionResponse } = useGetCollection(collectionId, {
    select: getShareAssetConfig
  });

  return (
    <ShareMenu
      shareAssetConfig={collectionResponse || null}
      assetId={collectionId}
      assetType={ShareAssetType.COLLECTION}>
      <ShareButton />
    </ShareMenu>
  );
});

ShareCollectionButton.displayName = 'ShareCollectionButton';
