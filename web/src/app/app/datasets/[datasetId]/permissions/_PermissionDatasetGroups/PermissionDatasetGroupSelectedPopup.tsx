import { useDatasetUpdateDatasetGroups } from '@/api/buster-rest';
import { AppMaterialIcons } from '@/components';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import { Button, Dropdown } from 'antd';
import { MenuProps } from 'antd/lib';
import React, { useMemo } from 'react';

export const PermissionDatasetGroupSelectedPopup: React.FC<{
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
        <PermissionDatasetGroupAssignButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
          datasetId={datasetId}
        />
      ]}
      show={show}
    />
  );
});
PermissionDatasetGroupSelectedPopup.displayName = 'PermissionDatasetGroupSelectedPopup';

const options = [
  {
    label: 'Included',
    value: true,
    icon: <AppMaterialIcons icon="done_all" />
  },
  {
    label: 'Not Included',
    value: false,
    icon: <AppMaterialIcons icon="remove_done" />
  }
];

const PermissionDatasetGroupAssignButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = ({ selectedRowKeys, onSelectChange, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups(datasetId);

  const onAssignClick = useMemoizedFn(async (assigned: boolean) => {
    try {
      const groups: { id: string; assigned: boolean }[] = selectedRowKeys.map((v) => ({
        id: v,
        assigned
      }));
      await updateDatasetGroups(groups);
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
        Included
      </Button>
    </Dropdown>
  );
};
