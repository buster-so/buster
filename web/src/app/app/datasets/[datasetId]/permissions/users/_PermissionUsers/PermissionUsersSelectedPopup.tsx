import { useDatasetUpdatePermissionUsers } from '@/api/buster_rest';
import { AppMaterialIcons } from '@/components';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import { Button, Dropdown } from 'antd';
import { MenuProps } from 'antd/lib';
import React, { useMemo } from 'react';
import { PERMISSION_USERS_OPTIONS } from './config';

export const PermissionUsersSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetId }) => {
  const show = selectedRowKeys.length > 0;

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <PermissionUsersAssignButton
          key="assign"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
          datasetId={datasetId}
        />
      ]}
      show={show}
    />
  );
});
PermissionUsersSelectedPopup.displayName = 'PermissionUsersSelectedPopup';

const options = PERMISSION_USERS_OPTIONS.map((v) => ({
  label: v.label,
  value: v.value,
  icon: v.value ? <AppMaterialIcons icon="done_all" /> : <AppMaterialIcons icon="remove_done" />
}));

const PermissionUsersAssignButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = ({ selectedRowKeys, onSelectChange, datasetId }) => {
  const { mutateAsync: updatePermissionUsers } = useDatasetUpdatePermissionUsers(datasetId);

  const onAssignClick = useMemoizedFn(async (assigned: boolean) => {
    try {
      await updatePermissionUsers(selectedRowKeys.map((v) => ({ id: v, assigned })));
      onSelectChange([]);
    } catch (error) {
      //  openErrorMessage('Failed to delete collection');
    }
  });

  const menuProps: MenuProps = useMemo(() => {
    return {
      selectable: true,
      items: options.map((v) => ({
        icon: v.icon,
        label: v.label,
        key: v.value ? 'included' : 'not_included',
        onClick: () => onAssignClick(v.value)
      }))
    };
  }, [selectedRowKeys]);

  const onButtonClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <Dropdown menu={menuProps} trigger={['click']}>
      <Button icon={<AppMaterialIcons icon="done_all" />} type="default" onClick={onButtonClick}>
        {options[0].label}
      </Button>
    </Dropdown>
  );
};
