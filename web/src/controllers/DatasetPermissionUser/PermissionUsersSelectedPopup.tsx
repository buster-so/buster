import { useDatasetUpdatePermissionUsers } from '@/api/buster_rest';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown';
import { CheckDouble, Xmark } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';
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
  icon: v.value === 'included' ? <CheckDouble /> : <Xmark />
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

  const menuProps: DropdownProps = useMemo(() => {
    return {
      selectable: true,
      items: options.map((v) => ({
        ...v,
        onClick: () => onAssignClick(v.value === 'included')
      }))
    };
  }, [selectedRowKeys]);

  const onButtonClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <Dropdown {...menuProps}>
      <Button prefix={<CheckDouble />} type="button" onClick={onButtonClick}>
        {options[0].label}
      </Button>
    </Dropdown>
  );
};
