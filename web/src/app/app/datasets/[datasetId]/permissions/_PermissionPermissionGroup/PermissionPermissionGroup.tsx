import React, { useState } from 'react';
import { HeaderExplanation } from '../HeaderExplanation';
import { PermissionSearch } from '../PermissionSearch';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components';
import { PermissionListPermissionGroupContainer } from './PermissionListPermissionGroupContainer';
import { NewPermissionGroupModal } from './NewPermissionGroupModal';
import { useDebounceSearch } from '@/hooks';
import { useDatasetListPermissionGroups } from '@/api/buster-rest';

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
      <HeaderExplanation
        className="mb-5"
        title="Dataset permissions"
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
            onClick={onOpenNewPermissionGroupModal}>
            New permission group
          </Button>
        </div>
        {isPermissionGroupsFetched && (
          <PermissionListPermissionGroupContainer
            filteredPermissionGroups={filteredItems}
            datasetId={datasetId}
          />
        )}
      </div>

      <NewPermissionGroupModal
        isOpen={isNewPermissionGroupModalOpen}
        onClose={onCloseNewPermissionGroupModal}
        datasetId={datasetId}
      />
    </>
  );
});

PermissionPermissionGroup.displayName = 'PermissionPermissionGroup';
