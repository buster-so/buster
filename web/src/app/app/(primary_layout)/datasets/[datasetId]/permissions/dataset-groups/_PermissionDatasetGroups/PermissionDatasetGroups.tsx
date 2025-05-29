'use client';

import { useDatasetListDatasetGroups } from '@/api/buster_rest';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import { NewDatasetGroupModal } from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
import { PermissionListDatasetGroupContainer } from './PermissionListDatasetGroupContainer';

export const PermissionDatasetGroups: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { data: datasetGroups, isFetched: isDatasetGroupsFetched } =
    useDatasetListDatasetGroups(datasetId);
  const [isNewDatasetGroupModalOpen, setIsNewDatasetGroupModalOpen] = useState(false);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasetGroups || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText)
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
        )}>
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

PermissionDatasetGroups.displayName = 'PermissionDatasetGroups';
