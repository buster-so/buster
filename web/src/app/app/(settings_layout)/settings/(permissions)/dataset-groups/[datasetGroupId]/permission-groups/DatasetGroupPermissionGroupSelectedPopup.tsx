import React from 'react';
import { useUpdateDatasetGroupPermissionGroups } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

export const DatasetGroupPermissionGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetGroupId }) => {
  const { mutateAsync: updateDatasetGroupDatasetGroups } = useUpdateDatasetGroupPermissionGroups();

  const onSelectAssigned = useMemoizedFn(async (data: { id: string; assigned: boolean }[]) => {
    await updateDatasetGroupDatasetGroups({
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
          onUpdate={onSelectAssigned}
        />
      ]}
    />
  );
});

DatasetGroupPermissionGroupSelectedPopup.displayName = 'DatasetGroupPermissionGroupSelectedPopup';
