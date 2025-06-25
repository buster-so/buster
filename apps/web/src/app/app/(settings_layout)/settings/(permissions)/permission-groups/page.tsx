'use client';

import { useState } from 'react';
import { useListAllPermissionGroups } from '@/api/buster_rest';
import {
  NewPermissionGroupModal,
  PermissionSearch
} from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { ListPermissionGroupsComponent } from './ListPermissionGroupsComponent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Permission groups'
};

export default function Page() {
  const { data: permissionGroups, isFetched, refetch } = useListAllPermissionGroups();
  const [isNewPermissionGroupModalOpen, setIsNewPermissionGroupModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: permissionGroups || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
  });

  const onCloseNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(false);
    refetch();
  });

  const onOpenNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(true);
  });

  return (
    <>
      <div className="flex h-full flex-col space-y-4 overflow-y-auto">
        <div className="px-[30px] pt-[46px]">
          <SettingsPageHeader
            title="Permission Groups"
            description="Manage your permission groups and set explicit permissions."
            type="alternate"
          />
          <div className="flex justify-between space-x-3">
            <PermissionSearch searchText={searchText} setSearchText={handleSearchChange} />
            <Button onClick={onOpenNewPermissionGroupModal} prefix={<Plus />}>
              New Permission Group
            </Button>
          </div>
        </div>

        <ListPermissionGroupsComponent permissionGroups={filteredItems} isFetched={isFetched} />
      </div>

      <NewPermissionGroupModal
        isOpen={isNewPermissionGroupModalOpen}
        onClose={onCloseNewPermissionGroupModal}
      />
    </>
  );
}
