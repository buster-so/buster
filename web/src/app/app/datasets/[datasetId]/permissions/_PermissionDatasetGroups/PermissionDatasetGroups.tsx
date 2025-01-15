import { useDatasetListDatasetGroups, useListDatasetGroups } from '@/api/buster-rest';
import React, { useState } from 'react';
import { useDebounceSearch } from '@/hooks';
import { useMemoizedFn } from 'ahooks';
import { HeaderExplanation } from '../HeaderExplanation';
import { PermissionSearch } from '../PermissionSearch';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components';
import { PermissionListDatasetGroupContainer } from './PermissionListDatasetGroupContainer';
import { NewDatasetGroupModal } from './NewPermissionDatasetGroupModal';

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

      <div className="flex h-full flex-col space-y-3">
        <div className="flex items-center justify-between">
          <PermissionSearch
            searchText={searchText}
            setSearchText={handleSearchChange}
            placeholder="Search by permission group"
          />

          <Button
            type="default"
            icon={<AppMaterialIcons icon="add" />}
            onClick={onOpenNewDatasetGroupModal}>
            New dataset group
          </Button>
        </div>
        {isDatasetGroupsFetched && (
          <PermissionListDatasetGroupContainer
            filteredPermissionGroups={filteredItems}
            datasetId={datasetId}
          />
        )}
      </div>

      <NewDatasetGroupModal
        isOpen={isNewDatasetGroupModalOpen}
        onClose={onCloseNewDatasetGroupModal}
        datasetId={datasetId}
      />
    </>
  );
});

PermissionDatasetGroups.displayName = 'PermissionDatasetGroups';
