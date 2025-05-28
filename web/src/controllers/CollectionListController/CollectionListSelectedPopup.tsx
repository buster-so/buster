import { ShareAssetType } from '@/api/asset_interfaces/share';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { useThreeDotFavoritesOptions } from '@/components/features/dropdowns/useThreeDotFavoritesOptions';
import { Button } from '@/components/ui/buttons';
import { Dropdown } from '@/components/ui/dropdown';
import { Dots, Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';
import React from 'react';

export const CollectionListSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
  const show = selectedRowKeys.length > 0;

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <CollectionDeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <ThreeDotButton
          key="three-dot"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
      show={show}
    />
  );
});

CollectionListSelectedPopup.displayName = 'CollectionListSelectedPopup';

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteCollection, isPending: isDeletingCollection } = useDeleteCollection();

  const onDeleteClick = useMemoizedFn(async () => {
    try {
      await deleteCollection({ id: selectedRowKeys });
      onSelectChange([]);
    } catch (error) {
      //  openErrorMessage('Failed to delete collection');
    }
  });

  return (
    <Button disabled={isDeletingCollection} prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};

const ThreeDotButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const dropdownOptions = useThreeDotFavoritesOptions({
    itemIds: selectedRowKeys,
    assetType: ShareAssetType.COLLECTION,
    onFinish: () => onSelectChange([])
  });

  return (
    <Dropdown items={dropdownOptions}>
      <Button prefix={<Dots />} />
    </Dropdown>
  );
};
