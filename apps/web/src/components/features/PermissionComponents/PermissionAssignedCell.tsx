import React from 'react';
import { Select, type SelectItem } from '@/components/ui/select';

export const PERMISSION_OPTIONS_INCLUDED: SelectItem<'true' | 'false'>[] = [
  {
    label: 'Included',
    value: 'true'
  },
  {
    label: 'Not Included',
    value: 'false'
  }
];

export const PERMISSION_OPTIONS_ASSIGNED: SelectItem<'true' | 'false'>[] = [
  {
    label: 'Assigned',
    value: 'true'
  },
  {
    label: 'Not assigned',
    value: 'false'
  }
];

export const PermissionAssignedCell: React.FC<{
  id: string;
  text: 'assigned' | 'included';
  assigned: boolean;
  onSelect: (params: { id: string; assigned: boolean }) => Promise<void>;
  children?: React.ReactNode;
}> = ({ id, text = 'included', assigned, onSelect, children }) => {
  const assignedValue = assigned ? 'true' : 'false';

  return (
    <div
      className="flex cursor-pointer items-center space-x-5"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}>
      {children}

      <Select
        items={text === 'included' ? PERMISSION_OPTIONS_INCLUDED : PERMISSION_OPTIONS_ASSIGNED}
        value={assignedValue}
        onChange={(value) => {
          onSelect({ id, assigned: value === 'true' });
        }}
      />
    </div>
  );
};

PermissionAssignedCell.displayName = 'PermissionAssignedCell';
