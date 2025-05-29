import React from 'react';
import type { VerificationStatus } from '@/api/asset_interfaces';
import { Dropdown } from '@/components/ui/dropdown';
import { useStatusDropdownContent } from './useStatusDropdownContent';

export const StatusDropdownContent: React.FC<{
  isAdmin: boolean;
  status: VerificationStatus;
  children: React.ReactNode;
  onChangeStatus: (status: VerificationStatus) => void;
  onOpenChange?: (open: boolean) => void;
}> = React.memo(({ isAdmin, status, onChangeStatus, children, onOpenChange }) => {
  const dropdownProps = useStatusDropdownContent({
    isAdmin,
    selectedStatus: status,
    onChangeStatus
  });

  //TODO move this to a combobox

  return (
    <Dropdown {...dropdownProps} onOpenChange={onOpenChange}>
      {children}
    </Dropdown>
  );
});
StatusDropdownContent.displayName = 'StatusDropdownContent';
