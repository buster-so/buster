'use client';

import React, { useState } from 'react';
import { useDatasetListPermissionGroups } from '@/api/buster_rest';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch, useMemoizedFn } from '@/hooks';
import { PermissionListPermissionGroupContainer } from './PermissionListPermissionGroupContainer';

export const PermissionPermissionGroup: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { data: permissionGroups, isFetched: isPermissionGroupsFetched } =
    useDatasetListPermissionGroups(datasetId);
  const [isNewPermissionGroupModalOpen, setIsNewPermissionGroupModalOpen] = useState(false);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: permissionGroups || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText)
  });

  const onCloseNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(false);
  });

  const onOpenNewPermissionGroupModal = useMemoizedFn(() => {
    setIsNewPermissionGroupModalOpen(true);
  });

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by permission group"
        searchChildren={React.useMemo(
          () => (
            <Button className="min-w-fit" prefix={<Plus />} onClick={onOpenNewPermissionGroupModal}>
              New permission group
            </Button>
          ),
          [onOpenNewPermissionGroupModal]
        )}>
        {isPermissionGroupsFetched && (
          <PermissionListPermissionGroupContainer
            filteredPermissionGroups={filteredItems}
            datasetId={datasetId}
          />
        )}
      </PermissionSearchAndListWrapper>

      <NewPermissionGroupModal
        isOpen={isNewPermissionGroupModalOpen}
        onClose={onCloseNewPermissionGroupModal}
        datasetId={datasetId}
      />
    </>
  );
});

PermissionPermissionGroup.displayName = 'PermissionPermissionGroup';
