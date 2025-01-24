import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { Button, Dropdown, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useDatasetUpdatePermissionGroups } from '@/api/buster_rest';
import { AppMaterialIcons } from '@/components/icons';
import { PERMISSION_OPTIONS_ASSIGNED } from '@/app/app/_components/PermissionComponents';

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
  const { mutateAsync: updatePermissionGroups, isPending } =
    useDatasetUpdatePermissionGroups(datasetId);

  const onClickItem = useMemoizedFn(async (assigned: boolean) => {
    try {
      await updatePermissionGroups(
        selectedRowKeys.map((id) => ({
          id,
          assigned
        }))
      );
      onSelectChange([]);
    } catch (error) {
      //
    }
  });

  const menu: MenuProps = useMemo(() => {
    return {
      items: PERMISSION_OPTIONS_ASSIGNED.map((option) => ({
        label: option.label,
        key: option.value ? 'true' : 'false',
        icon: option.value ? (
          <AppMaterialIcons icon="done_all" />
        ) : (
          <AppMaterialIcons icon="remove_done" />
        ),
        onClick: () => {
          onClickItem(option.value);
        }
      }))
    };
  }, []);

  return (
    <Dropdown menu={menu} trigger={['click']}>
      <Button loading={isPending}>Assign</Button>
    </Dropdown>
  );
};
