'use client';

import { useGetUserDatasets } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { UserDatasetsListContainer } from './UserDatasetsListContainer';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components/icons';
import { NewDatasetModal } from '@appComponents/NewDatasetModal';

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
      <Button type="default" icon={<AppMaterialIcons icon="add" />} onClick={onOpenNewDatasetModal}>
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
