import { useUpdateUserDatasetGroups } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/app/app/_components/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';

export const UserDatasetGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  userId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, userId }) => {
  const { mutateAsync: updateUserDatasetGroups } = useUpdateUserDatasetGroups({ userId });

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
          onUpdate={updateUserDatasetGroups}
        />
      ]}
    />
  );
});

UserDatasetGroupSelectedPopup.displayName = 'UserDatasetGroupSelectedPopup';
