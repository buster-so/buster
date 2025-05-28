'use client';

import { useGetUserPermissionGroups } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@/components/features/PermissionComponents';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserPermissionGroupsListContainer } from './UserPermissionGroupsListContainer';
import { Button } from '@/components/ui/buttons';
import { useMemoizedFn } from '@/hooks';
import { Plus } from '@/components/ui/icons';

export const UserPermissionGroupsController: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: permissionGroups } = useGetUserPermissionGroups({ userId });
  const [isNewPermissionGroupModalOpen, setIsNewPermissionGroupModalOpen] = useState(false);
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: permissionGroups || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText)
  });

  const onCloseNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(false);
  });

  const onOpenNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(true);
  });

  const NewPermissionGroupButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewPermissionGroupModal}>
        New permission group
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by user permission group"
        searchChildren={NewPermissionGroupButton}>
        <UserPermissionGroupsListContainer
          filteredPermissionGroups={filteredItems}
          userId={userId}
        />
      </PermissionSearchAndListWrapper>

      <NewPermissionGroupModal
        isOpen={isNewPermissionGroupModalOpen}
        onClose={onCloseNewPermissionGroupModal}
        datasetId={null}
        userId={userId}
      />
    </>
  );
};
