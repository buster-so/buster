import React from 'react';
import { useDatasetUpdateDatasetGroups } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

export const PermissionDatasetGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups();

  const onUpdate = useMemoizedFn(async (groups: { id: string; assigned: boolean }[]) => {
    return updateDatasetGroups({ dataset_id: datasetId, groups });
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
PermissionDatasetGroupSelectedPopup.displayName = 'PermissionDatasetGroupSelectedPopup';
