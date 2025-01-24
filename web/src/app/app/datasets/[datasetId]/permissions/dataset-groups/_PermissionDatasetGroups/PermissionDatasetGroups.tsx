'use client';

import { useDatasetListDatasetGroups } from '@/api/buster_rest';
import React, { useState } from 'react';
import { useDebounceSearch } from '@/hooks';
import { useMemoizedFn } from 'ahooks';
import {
  PermissionSearchAndListWrapper,
  HeaderExplanation
} from '@/app/app/_components/PermissionComponents';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components';
import { PermissionListDatasetGroupContainer } from './PermissionListDatasetGroupContainer';
import { NewDatasetGroupModal } from '@appComponents/PermissionComponents';

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
      <HeaderExplanation
        className="mb-5"
        title="Dataset groups"
        description="Manage who can build dashboards & metrics using this dataset"
      />

      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by permission group"
        searchChildren={React.useMemo(
          () => (
            <Button
              type="default"
              icon={<AppMaterialIcons icon="add" />}
              onClick={onOpenNewDatasetGroupModal}>
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
