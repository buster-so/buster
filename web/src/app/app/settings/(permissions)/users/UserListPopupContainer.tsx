import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';

export const UserListPopupContainer = React.memo(
  ({
    selectedRowKeys,
    onSelectChange
  }: {
    selectedRowKeys: string[];
    onSelectChange: (selectedRowKeys: string[]) => void;
  }) => {
    return (
      <BusterListSelectedOptionPopupContainer
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        buttons={[]}
      />
    );
  }
);

UserListPopupContainer.displayName = 'UserListPopupContainer';

const PermissionGroupAssignButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
  return <div>PermissionGroupAssignButton</div>;
});

PermissionGroupAssignButton.displayName = 'PermissionGroupAssignButton';
