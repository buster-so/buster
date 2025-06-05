import React from 'react';
import { useUpdatePermissionGroupUsers } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';

export const PermissionGroupUsersSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  permissionGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, permissionGroupId }) => {
  const { mutateAsync: updatePermissionGroupUsers } =
    useUpdatePermissionGroupUsers(permissionGroupId);

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
          onUpdate={updatePermissionGroupUsers}
        />
      ]}
    />
  );
});

PermissionGroupUsersSelectedPopup.displayName = 'PermissionGroupUsersSelectedPopup';
