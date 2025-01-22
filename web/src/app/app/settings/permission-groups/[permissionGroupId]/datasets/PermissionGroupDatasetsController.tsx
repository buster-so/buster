'use client';

import { useGetPermissionGroupDatasets } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionSearchAndListWrapper } from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { PermissionGroupDatasetsListContainer } from './PermissionGroupDatasetsListContainer';
import { useMemoizedFn } from 'ahooks';
import { NewDatasetModal } from '@/app/app/_components/NewDatasetModal';

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
