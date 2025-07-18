import React from 'react';
import { useUpdateUserDatasets } from '@/api/buster_rest/users/permissions';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';

export const UserDatasetsSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  userId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, userId }) => {
  const { mutateAsync: updateUserDatasets } = useUpdateUserDatasets({ userId });

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
          onUpdate={updateUserDatasets}
        />
      ]}
    />
  );
});

UserDatasetsSelectedPopup.displayName = 'UserDatasetsSelectedPopup';
