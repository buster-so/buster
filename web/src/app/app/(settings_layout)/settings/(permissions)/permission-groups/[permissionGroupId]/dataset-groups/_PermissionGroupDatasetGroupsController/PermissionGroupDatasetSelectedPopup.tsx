import React from 'react';
import { useUpdatePermissionGroupDatasetGroups } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

export const PermissionGroupDatasetGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  permissionGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, permissionGroupId }) => {
  const { mutateAsync: updatePermissionGroupDatasetGroups } =
    useUpdatePermissionGroupDatasetGroups(permissionGroupId);

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }[]) => {
    await updatePermissionGroupDatasetGroups(params);
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

PermissionGroupDatasetGroupSelectedPopup.displayName = 'PermissionGroupDatasetGroupSelectedPopup';
