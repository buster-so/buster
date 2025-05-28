'use client';

import { useGetDatasetGroupDatasets } from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { DatasetGroupDatasetsListContainer } from './DatasetGroupDatasetsListContainer';
import { useMemoizedFn } from '@/hooks';
import { NewDatasetModal } from '@/components/features/modal/NewDatasetModal';

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
        <DatasetGroupDatasetsListContainer
          filteredDatasets={filteredItems}
          datasetGroupId={datasetGroupId}
        />
      </PermissionSearchAndListWrapper>

      <NewDatasetModal open={isNewDatasetModalOpen} onClose={onCloseNewDatasetModal} />
    </>
  );
};
