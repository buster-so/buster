'use client';

import { useGetPermissionGroupDatasets } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons';

import { PermissionGroupDatasetsListContainer } from './PermissionGroupDatasetsListContainer';
import { useMemoizedFn } from '@/hooks';
import { NewDatasetModal } from '@/components/features/modal/NewDatasetModal';
import { Plus } from '@/components/ui/icons';

export const PermissionGroupDatasetsController: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const { data } = useGetPermissionGroupDatasets(permissionGroupId);
  const [isNewDatasetModalOpen, setIsNewDatasetModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) => item.name.includes(searchText)
  });

  const onCloseNewDatasetModal = useMemoizedFn(() => {
    setIsNewDatasetModalOpen(false);
  });

  const onOpenNewDatasetModal = useMemoizedFn(() => {
    setIsNewDatasetModalOpen(true);
  });

  const NewDatasetButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewDatasetModal}>
        New dataset
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by dataset name..."
        searchChildren={NewDatasetButton}>
        <PermissionGroupDatasetsListContainer
          filteredDatasets={filteredItems}
          permissionGroupId={permissionGroupId}
        />
      </PermissionSearchAndListWrapper>

      <NewDatasetModal open={isNewDatasetModalOpen} onClose={onCloseNewDatasetModal} />
    </>
  );
};
