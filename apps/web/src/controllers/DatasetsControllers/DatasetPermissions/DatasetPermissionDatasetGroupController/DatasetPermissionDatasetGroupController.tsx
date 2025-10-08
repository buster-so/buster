import React, { useState } from 'react';
import { useDatasetListDatasetGroups } from '@/api/buster_rest/datasets';
import {
  NewDatasetGroupModal,
  PermissionSearchAndListWrapper,
} from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { PermissionListDatasetGroupContainer } from './PermissionListDatasetGroupContainer';

export const DatasetPermissionDatasetGroupController: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { data: datasetGroups, isFetched: isDatasetGroupsFetched } =
    useDatasetListDatasetGroups(datasetId);
  const [isNewDatasetGroupModalOpen, setIsNewDatasetGroupModalOpen] = useState(false);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasetGroups || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText),
  });

  const onCloseNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(false);
  });

  const onOpenNewDatasetGroupModal = useMemoizedFn(() => {
    setIsNewDatasetGroupModalOpen(true);
  });

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by dataset group"
        searchChildren={React.useMemo(
          () => (
            <Button prefix={<Plus />} onClick={onOpenNewDatasetGroupModal}>
              New dataset group
            </Button>
          ),
          [onOpenNewDatasetGroupModal]
        )}
      >
        {isDatasetGroupsFetched && (
          <PermissionListDatasetGroupContainer
            filteredDatasetGroups={filteredItems}
            datasetId={datasetId}
          />
        )}
      </PermissionSearchAndListWrapper>

      <NewDatasetGroupModal
        isOpen={isNewDatasetGroupModalOpen}
        onClose={onCloseNewDatasetGroupModal}
        datasetId={datasetId}
      />
    </>
  );
});

DatasetPermissionDatasetGroupController.displayName = 'DatasetPermissionDatasetGroupController';
