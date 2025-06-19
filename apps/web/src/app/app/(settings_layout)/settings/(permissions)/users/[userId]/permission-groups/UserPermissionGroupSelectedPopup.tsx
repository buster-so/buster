import React from 'react';
import { useUpdateUserPermissionGroups } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';

export const UserPermissionGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  userId: string;
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange, userId }) => {
  const { mutateAsync: updateUserPermissionGroups } = useUpdateUserPermissionGroups({ userId });

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
          onUpdate={updateUserPermissionGroups}
        />
      ]}
    />
  );
});

UserPermissionGroupSelectedPopup.displayName = 'UserPermissionGroupSelectedPopup';
