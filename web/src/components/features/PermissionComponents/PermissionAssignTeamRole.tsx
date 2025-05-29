import { TeamRole } from '@/api/asset_interfaces';
import { Select, type SelectItem } from '@/components/ui/select';
import React from 'react';

export const TEAM_ROLE_OPTIONS: SelectItem<TeamRole>[] = [
  {
    label: 'Manager',
    value: TeamRole.MANAGER
  },
  {
    label: 'Member',
    value: TeamRole.MEMBER
  },
  {
    label: 'Not a Member',
    value: TeamRole.NONE
  }
];

export const PermissionAssignTeamRole: React.FC<{
  role: TeamRole;
  id: string;
  onRoleChange: (data: { id: string; role: TeamRole }) => void;
  children?: React.ReactNode;
}> = React.memo(({ role, id, onRoleChange, children }) => {
  return (
    <button
      type="button"
      className="flex items-center space-x-5"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}>
      {children}
      <Select
        items={TEAM_ROLE_OPTIONS}
        value={role}
        onChange={(v) => {
          onRoleChange({ id, role: v as TeamRole });
        }}
      />
    </button>
  );
});

PermissionAssignTeamRole.displayName = 'PermissionAssignTeamRole';
