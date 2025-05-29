import React from 'react';
import { useUpdateDatasetGroupUsers } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

export const DatasetGroupUsersSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetGroupId }) => {
  const { mutateAsync: updateDatasetGroupUsers } = useUpdateDatasetGroupUsers();

  const onUpdate = useMemoizedFn(async (data: { id: string; assigned: boolean }[]) => {
    await updateDatasetGroupUsers({
      datasetGroupId,
      data
    });
  });

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <PermissionAssignedButton
          key="assign"
          text="assigned"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
          onUpdate={onUpdate}
        />
      ]}
    />
  );
});

DatasetGroupUsersSelectedPopup.displayName = 'DatasetGroupUsersSelectedPopup';
