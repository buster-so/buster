import React, { useMemo } from 'react';
import type { TeamRole } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown';
import { CheckDouble } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import { TEAM_ROLE_OPTIONS } from './PermissionAssignTeamRole';

export const PermissionAssignTeamRoleButton: React.FC<{
  onRoleChange: (role: TeamRole) => void;
}> = React.memo(({ onRoleChange }) => {
  const menuProps: DropdownProps = useMemo(() => {
    return {
      selectable: true,
      items: TEAM_ROLE_OPTIONS.map(({ label, value }) => ({
        label,
        value,
        onClick: () => onRoleChange(value)
      }))
    };
  }, [onRoleChange]);

  const onButtonClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <Dropdown {...menuProps}>
      <Button prefix={<CheckDouble />} onClick={onButtonClick}>
        Assign Team Role
      </Button>
    </Dropdown>
  );
});

PermissionAssignTeamRoleButton.displayName = 'PermissionAssignTeamRoleButton';
