import React from 'react';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { useDatasetContextSelector } from '@/context/Datasets';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useDeleteDataset } from '@/api/buster_rest';

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
        const promises = selectedRowKeys.map((v) => {
          return onDeleteDataset(v);
        });
        await Promise.all(promises);
        onSelectChange([]);
      }
    });
  });

  return (
    <Button type="default" onClick={onDeleteClick}>
      Delete
    </Button>
  );
};
