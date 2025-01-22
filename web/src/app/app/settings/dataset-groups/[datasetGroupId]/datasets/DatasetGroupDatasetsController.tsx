'use client';

import { useGetDatasetGroupDatasets, useGetPermissionGroupDatasets } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionSearchAndListWrapper } from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { DatasetGroupDatasetsListContainer } from './DatasetGroupDatasetsListContainer';
import { useMemoizedFn } from 'ahooks';
import { NewDatasetModal } from '@/app/app/_components/NewDatasetModal';

export const DatasetGroupDatasetsController: React.FC<{
  datasetGroupId: string;
}> = ({ datasetGroupId }) => {
  const { data } = useGetDatasetGroupDatasets(datasetGroupId);
  const [isNewDatasetModalOpen, setIsNewDatasetModalOpen] = useState(false);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
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
        <DatasetGroupDatasetsListContainer
          filteredDatasets={filteredItems}
          datasetGroupId={datasetGroupId}
        />
      </PermissionSearchAndListWrapper>

      <NewDatasetModal open={isNewDatasetModalOpen} onClose={onCloseNewDatasetModal} />
    </>
  );
};
