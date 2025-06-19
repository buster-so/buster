import React, { useMemo } from 'react';
import { useDatasetUpdatePermissionGroups } from '@/api/buster_rest';
import { PERMISSION_OPTIONS_ASSIGNED } from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownItem } from '@/components/ui/dropdown';
import { CheckDouble, Xmark } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

export const PermissionGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  datasetId: string;
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetId }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <PermissionGroupAssignButton
          key="assign"
          selectedRowKeys={selectedRowKeys}
          datasetId={datasetId}
          onSelectChange={onSelectChange}
        />
      ]}
    />
  );
});

PermissionGroupSelectedPopup.displayName = 'PermissionGroupSelectedPopup';

const PermissionGroupAssignButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = ({ selectedRowKeys, onSelectChange, datasetId }) => {
  const { mutateAsync: updatePermissionGroups, isPending } = useDatasetUpdatePermissionGroups();

  const onClickItem = useMemoizedFn(async (assigned: boolean) => {
    try {
      await updatePermissionGroups({
        dataset_id: datasetId,
        groups: selectedRowKeys.map((id) => ({
          id,
          assigned
        }))
      });
      onSelectChange([]);
    } catch (error) {
      //
    }
  });

  const items: DropdownItem<'true' | 'false'>[] = useMemo(() => {
    return PERMISSION_OPTIONS_ASSIGNED.map((option) => ({
      label: option.label,
      value: option.value ? 'true' : 'false',
      icon: option.value ? <CheckDouble /> : <Xmark />,
      onClick: () => {
        onClickItem(option.value === 'true');
      }
    }));
  }, []);

  return (
    <Dropdown items={items}>
      <Button loading={isPending}>Assign</Button>
    </Dropdown>
  );
};
