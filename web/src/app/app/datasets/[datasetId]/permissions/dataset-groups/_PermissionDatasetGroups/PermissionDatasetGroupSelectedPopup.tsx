import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';
import { PermissionAssignedButton } from '@appComponents/PermissionComponents';
import { useDatasetUpdateDatasetGroups } from '@/api/buster_rest';

export const PermissionDatasetGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups(datasetId);

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
          onUpdate={updateDatasetGroups}
        />
      ]}
    />
  );
});
PermissionDatasetGroupSelectedPopup.displayName = 'PermissionDatasetGroupSelectedPopup';
