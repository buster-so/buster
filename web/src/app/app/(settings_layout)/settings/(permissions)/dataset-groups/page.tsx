'use client';
import { useListDatasetGroups } from '@/api/buster_rest';
import { NewDatasetGroupModal, PermissionSearch } from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import React, { useState } from 'react';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { ListDatasetGroupsComponent } from './ListDatasetGroupsComponent';

export default function Page() {
  const { data: datasetGroups, isFetched } = useListDatasetGroups();
  const [isNewDatasetGroupModalOpen, setIsNewDatasetGroupModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: datasetGroups || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
  });

  const onCloseNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(false);
  });

  const onOpenNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(true);
  });

  return (
    <>
      <div className="flex h-full flex-col space-y-4 overflow-y-auto">
        <div className="px-[30px] pt-[46px]">
          <SettingsPageHeader
            title="Dataset Groups"
            description="Organize your datasets into groups for more granular permissions."
            type="alternate"
          />
          <div className="flex justify-between space-x-3">
            <PermissionSearch searchText={searchText} setSearchText={handleSearchChange} />
            <Button onClick={onOpenNewDatasetGroupModal} variant="default" prefix={<Plus />}>
              New dataset group
            </Button>
          </div>
        </div>
        <div className="">
          <ListDatasetGroupsComponent datasetGroups={filteredItems} isFetched={isFetched} />
        </div>
      </div>

      <NewDatasetGroupModal
        isOpen={isNewDatasetGroupModalOpen}
        onClose={onCloseNewDatasetGroupModal}
      />
    </>
  );
}
