'use client';

import type React from 'react';
import { useMemo, useState } from 'react';
import { useGetDatasetGroupPermissionGroups } from '@/api/buster_rest';
import {
  NewDatasetGroupModal,
  PermissionSearchAndListWrapper
} from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { DatasetGroupPermissionGroupsListContainer } from './DatasetGroupPermissionGroupsListContainer';

export const DatasetGroupPermissionGroupsController: React.FC<{
  datasetGroupId: string;
}> = ({ datasetGroupId }) => {
  const { data } = useGetDatasetGroupPermissionGroups(datasetGroupId);
  const [isNewDatasetGroupModalOpen, setIsNewDatasetGroupModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
  });

  const onCloseNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(false);
  });

  const onOpenNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(true);
  });

  const NewDatasetGroupButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewDatasetGroupModal}>
        New dataset group
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by dataset group name..."
        searchChildren={NewDatasetGroupButton}>
        <DatasetGroupPermissionGroupsListContainer
          filteredDatasetGroups={filteredItems}
          datasetGroupId={datasetGroupId}
        />
      </PermissionSearchAndListWrapper>

      <NewDatasetGroupModal
        isOpen={isNewDatasetGroupModalOpen}
        onClose={onCloseNewDatasetGroupModal}
        datasetId={null}
      />
    </>
  );
};
