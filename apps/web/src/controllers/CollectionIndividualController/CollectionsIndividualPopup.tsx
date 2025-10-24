import React from 'react';
import { useGetCollection, useRemoveAssetFromCollection } from '@/api/buster_rest/collections';
import { Button } from '@/components/ui/buttons';
import { Trash } from '@/components/ui/icons';
import { ListSelectedOptionPopupContainer } from '@/components/ui/list/BusterListNew';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const CollectionIndividualSelectedPopup: React.FC<{
  selectedRowKeys: Set<string>;
  collectionId: string;
  onSelectChange: (selectedRowKeys: Set<string>) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange, collectionId }) => {
  const show = selectedRowKeys.size > 0;

  return (
    <ListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <CollectionDeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          collectionId={collectionId}
          onSelectChange={onSelectChange}
        />,
      ]}
      show={show}
    />
  );
});

CollectionIndividualSelectedPopup.displayName = 'CollectionIndividualSelectedPopup';

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: Set<string>;
  collectionId: string;
  onSelectChange: (selectedRowKeys: Set<string>) => void;
}> = ({ selectedRowKeys, collectionId }) => {
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { data: collection } = useGetCollection(collectionId);

  const onRemoveFromCollection = useMemoizedFn(async () => {
    if (collection) {
      await removeAssetFromCollection({
        id: collectionId,
        assets: (collection.assets || [])?.reduce<
          { type: 'metric_file' | 'dashboard_file'; id: string }[]
        >((result, asset) => {
          if (selectedRowKeys.has(asset.id)) {
            result.push({
              type: asset.asset_type as 'metric_file' | 'dashboard_file',
              id: asset.id,
            });
          }
          return result;
        }, []),
      });
    }
  });

  return (
    <Button prefix={<Trash />} onClick={onRemoveFromCollection}>
      Delete
    </Button>
  );
};
