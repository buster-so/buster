'use client';

import { useGetUserDatasets } from '@/api/buster_rest';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { useDebounceSearch } from '@/hooks';
import { useMemoizedFn } from '@/hooks';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserDatasetsListContainer } from './UserDatasetsListContainer';

import { NewDatasetModal } from '@/components/features/modal/NewDatasetModal';
import { Plus } from '@/components/ui/icons';

export const UserDatasetsController: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: datasets } = useGetUserDatasets({ userId });
  const [isNewDatasetModalOpen, setIsNewDatasetModalOpen] = useState(false);
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasets || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText)
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
        searchPlaceholder="Search by dataset group"
        searchChildren={NewDatasetButton}>
        <UserDatasetsListContainer filteredDatasets={filteredItems} userId={userId} />
      </PermissionSearchAndListWrapper>

      <NewDatasetModal open={isNewDatasetModalOpen} onClose={onCloseNewDatasetModal} />
    </>
  );
};
