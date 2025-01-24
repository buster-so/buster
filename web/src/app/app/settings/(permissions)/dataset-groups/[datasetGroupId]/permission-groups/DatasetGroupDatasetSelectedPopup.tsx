import {
  updatePermissionGroupDatasetGroups,
  useUpdateDatasetGroupPermissionGroups,
  useUpdatePermissionGroupDatasetGroups
} from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/app/app/_components/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import React from 'react';

export const DatasetGroupDatasetGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetGroupId }) => {
  const { mutateAsync: updateDatasetGroupDatasetGroups } =
    useUpdateDatasetGroupPermissionGroups(datasetGroupId);

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }[]) => {
    await updateDatasetGroupDatasetGroups(params);
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

DatasetGroupDatasetGroupSelectedPopup.displayName = 'DatasetGroupDatasetGroupSelectedPopup';
