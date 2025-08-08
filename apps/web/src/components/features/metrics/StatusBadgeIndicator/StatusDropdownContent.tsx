import React from 'react';
import type { VerificationStatus } from '@buster/server-shared/share';
import { Dropdown } from '@/components/ui/dropdown';
import { useStatusDropdownContent } from './useStatusDropdownContent';

export const StatusDropdownContent: React.FC<{
  isAdmin: boolean;
  status: VerificationStatus;
  children: React.ReactNode;
  onChangeStatus: (status: VerificationStatus) => void;
  onOpenChange?: (open: boolean) => void;
}> = ({ isAdmin, status, onChangeStatus, children, onOpenChange }) => {
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
};
StatusDropdownContent.displayName = 'StatusDropdownContent';
