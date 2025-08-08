import React from 'react';
import { Select, type SelectItem } from '@/components/ui/select';
import type { TeamRole } from '@buster/server-shared/teams';

export const TEAM_ROLE_OPTIONS: SelectItem<TeamRole>[] = [
  {
    label: 'Manager',
    value: 'manager'
  },
  {
    label: 'Member',
    value: 'member'
  },
  {
    label: 'Not a Member',
    value: 'none'
  }
];

export const PermissionAssignTeamRole: React.FC<{
  role: TeamRole;
  id: string;
  onRoleChange: (data: { id: string; role: TeamRole }) => void;
  children?: React.ReactNode;
}> = ({ role, id, onRoleChange, children }) => {
  return (
    <div
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
    </div>
  );
};

PermissionAssignTeamRole.displayName = 'PermissionAssignTeamRole';
