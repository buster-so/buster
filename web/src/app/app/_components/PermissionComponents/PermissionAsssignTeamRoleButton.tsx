import { TeamRole } from '@/api/buster_rest';
import { TEAM_ROLE_OPTIONS } from './PermissionAssignTeamRole';
import React, { useMemo } from 'react';
import { Button, Dropdown, MenuProps } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components';

export const PermissionAssignTeamRoleButton: React.FC<{
  onRoleChange: (role: TeamRole) => void;
}> = React.memo(({ onRoleChange }) => {
  const menuProps: MenuProps = useMemo(() => {
    return {
      selectable: true,
      items: TEAM_ROLE_OPTIONS.map(({ label, value }) => ({
        label,
        key: value,
        onClick: () => onRoleChange(value)
      }))
    };
  }, [onRoleChange]);

  const onButtonClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <Dropdown menu={menuProps} trigger={['click']}>
      <Button icon={<AppMaterialIcons icon="done_all" />} type="default" onClick={onButtonClick}>
        Assign Team Role
      </Button>
    </Dropdown>
  );
});

PermissionAssignTeamRoleButton.displayName = 'PermissionAssignTeamRoleButton';
