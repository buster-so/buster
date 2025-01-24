import { useUpdateUserPermissionGroups } from '@/api';
import { PermissionAssignedButton } from '@/app/app/_components/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';

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
