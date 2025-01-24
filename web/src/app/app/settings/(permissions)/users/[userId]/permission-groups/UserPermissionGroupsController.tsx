'use client';

import { useGetUserPermissionGroups } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { UserPermissionGroupsListContainer } from './UserPermissionGroupsListContainer';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components/icons';

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
      <Button
        type="default"
        icon={<AppMaterialIcons icon="add" />}
        onClick={onOpenNewPermissionGroupModal}>
        New permission group
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by permission group"
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
