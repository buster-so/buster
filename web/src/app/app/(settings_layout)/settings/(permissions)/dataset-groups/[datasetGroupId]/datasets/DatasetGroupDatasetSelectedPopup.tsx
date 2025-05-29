import React from 'react';
import { useUpdateDatasetGroupDatasets } from '@/api/buster_rest';
import { PermissionAssignedButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

export const DatasetGroupDatasetSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetGroupId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetGroupId }) => {
  const { mutateAsync: updateDatasetGroupDatasets } = useUpdateDatasetGroupDatasets();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }[]) => {
    await updateDatasetGroupDatasets({
      datasetGroupId,
      groups: params
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

DatasetGroupDatasetSelectedPopup.displayName = 'DatasetGroupDatasetSelectedPopup';
