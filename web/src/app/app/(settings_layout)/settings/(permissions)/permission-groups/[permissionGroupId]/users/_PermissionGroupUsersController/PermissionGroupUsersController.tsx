'use client';

import { useGetPermissionGroupUsers } from '@/api/buster_rest';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/BusterAppLayout';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import type React from 'react';
import { useMemo } from 'react';
import { PermissionGroupUsersListContainer } from './PermissionGroupUsersListContainer';

export const PermissionGroupUsersController: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const { data } = useGetPermissionGroupUsers(permissionGroupId);
  const onToggleInviteModal = useInviteModalStore((x) => x.onToggleInviteModal);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) =>
      item.email.includes(searchText) || item.name.includes(searchText)
  });

  const NewUserButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={() => onToggleInviteModal(true)}>
        Invite user
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by user name or email..."
        searchChildren={NewUserButton}>
        <PermissionGroupUsersListContainer
          filteredUsers={filteredItems}
          permissionGroupId={permissionGroupId}
        />
      </PermissionSearchAndListWrapper>
    </>
  );
};
