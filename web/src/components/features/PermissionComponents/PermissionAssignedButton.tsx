import type React from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownItem, type DropdownProps } from '@/components/ui/dropdown';
import { CheckDouble, Xmark } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import { PERMISSION_OPTIONS_ASSIGNED, PERMISSION_OPTIONS_INCLUDED } from './PermissionAssignedCell';

export const PermissionAssignedButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  text: 'assigned' | 'included';
  onUpdate: (groups: { id: string; assigned: boolean }[]) => Promise<void>;
}> = ({ selectedRowKeys, text, onUpdate, onSelectChange }) => {
  const options = useMemo(() => {
    const selectedOptions =
      text === 'included' ? PERMISSION_OPTIONS_INCLUDED : PERMISSION_OPTIONS_ASSIGNED;
    return selectedOptions.map((v) => ({
      ...v,
      icon: v.value === 'true' ? <CheckDouble /> : <Xmark />
    }));
  }, [text]);

  const buttonText = useMemo(() => {
    return text === 'included' ? 'Include' : 'Assign';
  }, [text]);

  const onAssignClick = useMemoizedFn(async (assigned: boolean) => {
    try {
      const groups: { id: string; assigned: boolean }[] = selectedRowKeys.map((v) => ({
        id: v,
        assigned
      }));
      await onUpdate(groups);
      onSelectChange([]);
    } catch (error) {
      //  openErrorMessage('Failed to delete collection');
    }
  });

  const menuProps: DropdownProps = useMemo(() => {
    return {
      selectable: true,
      items: options.map<DropdownItem>((v) => ({
        value: v.value === 'true' ? 'included' : 'not_included',
        icon: v.icon,
        label: v.label,
        onClick: () => onAssignClick(v.value === 'true')
      }))
    };
  }, [selectedRowKeys]);

  const onButtonClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <Dropdown {...menuProps}>
      <Button onClick={onButtonClick}>{buttonText}</Button>
    </Dropdown>
  );
};
