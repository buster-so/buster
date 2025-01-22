import {
  useUpdatePermissionGroupDatasets,
  useUpdatePermissionGroupUsers,
  useUpdateUserDatasets
} from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/app/app/_components/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import React from 'react';

export const PermissionGroupDatasetSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  permissionGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, permissionGroupId }) => {
  const { mutateAsync: updatePermissionGroupDatasets } = useUpdatePermissionGroupDatasets();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }[]) => {
    await updatePermissionGroupDatasets({
      permissionGroupId,
      data: params
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

PermissionGroupDatasetSelectedPopup.displayName = 'PermissionGroupDatasetSelectedPopup';
