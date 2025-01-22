import {
  useUpdateDatasetGroupUsers,
  useUpdatePermissionGroupUsers,
  useUpdateUserDatasets
} from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/app/app/_components/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';

export const DatasetGroupUsersSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetGroupId }) => {
  const { mutateAsync: updateDatasetGroupUsers } = useUpdateDatasetGroupUsers(datasetGroupId);

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
          onUpdate={updateDatasetGroupUsers}
        />
      ]}
    />
  );
});

DatasetGroupUsersSelectedPopup.displayName = 'DatasetGroupUsersSelectedPopup';
