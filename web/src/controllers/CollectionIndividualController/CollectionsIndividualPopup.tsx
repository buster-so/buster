import { useGetCollection, useRemoveAssetFromCollection } from '@/api/buster_rest/collections';
import { Button } from '@/components/ui/buttons';
import { Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';
import React from 'react';

export const CollectionIndividualSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  collectionId: string;
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange, collectionId }) => {
  const show = selectedRowKeys.length > 0;

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <CollectionDeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          collectionId={collectionId}
          onSelectChange={onSelectChange}
        />
      ]}
      show={show}
    />
  );
});

CollectionIndividualSelectedPopup.displayName = 'CollectionIndividualSelectedPopup';

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: string[];
  collectionId: string;
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange, collectionId }) => {
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { data: collection } = useGetCollection(collectionId);

  const onRemoveFromCollection = useMemoizedFn(async () => {
    if (collection) {
      await removeAssetFromCollection({
        id: collectionId,
        assets: (collection.assets || [])?.reduce<{ type: 'metric' | 'dashboard'; id: string }[]>(
          (result, asset) => {
            if (selectedRowKeys.includes(asset.id)) {
              result.push({
                type: asset.asset_type as 'metric' | 'dashboard',
                id: asset.id
              });
            }
            return result;
          },
          []
        )
      });
    }
  });

  return (
    <Button prefix={<Trash />} onClick={onRemoveFromCollection}>
      Delete
    </Button>
  );
};
