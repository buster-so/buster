import { BusterCollectionItemAsset } from '@/api/buster_rest/collection';
import { AppMaterialIcons } from '@/components';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import React from 'react';

export const CollectionIndividualSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onDeleteClick: () => Promise<void>;
}> = ({ selectedRowKeys, onSelectChange, onDeleteClick }) => {
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
          onDeleteClick={onDeleteClick}
        />
      ]}
      show={show}
    />
  );
};

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onDeleteClick: () => Promise<void>;
}> = ({ selectedRowKeys, onSelectChange, onDeleteClick }) => {
  const onBulkAddRemoveToCollection = useCollectionsContextSelector(
    (x) => x.onBulkAddRemoveToCollection
  );

  return (
    <Button icon={<AppMaterialIcons icon="delete" />} type="default" onClick={onDeleteClick}>
      Delete
    </Button>
  );
};
