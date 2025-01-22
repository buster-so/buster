'use client';

import {
  useGetDatasetGroupPermissionGroups,
  useGetPermissionGroupDatasetGroups
} from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import {
  NewDatasetGroupModal,
  PermissionSearchAndListWrapper
} from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { DatasetGroupDatasetGroupsListContainer } from './DatasetGroupDatasetsListContainer';
import { useMemoizedFn } from 'ahooks';

export const DatasetGroupDatasetGroupsController: React.FC<{
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
      <Button
        type="default"
        icon={<AppMaterialIcons icon="add" />}
        onClick={onOpenNewDatasetGroupModal}>
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
        <DatasetGroupDatasetGroupsListContainer
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
