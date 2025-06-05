import React from 'react';
import { useDeleteDataset } from '@/api/buster_rest';
import { Button } from '@/components/ui/buttons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';

export const DatasetSelectedOptionPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <DeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
      show={selectedRowKeys.length > 0}
    />
  );
});
DatasetSelectedOptionPopup.displayName = 'DatasetSelectedOptionPopup';

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: onDeleteDataset } = useDeleteDataset();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteClick = useMemoizedFn(async () => {
    await openConfirmModal({
      title: 'Delete dataset',
      content: 'Are you sure you want to delete this dataset?',
      onOk: async () => {
        await onDeleteDataset(selectedRowKeys);
        onSelectChange([]);
      }
    });
  });

  return <Button onClick={onDeleteClick}>Delete</Button>;
};
