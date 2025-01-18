'use client';

import React from 'react';
import { PermissionSearch, HeaderExplanation } from '@/app/app/_components/PermissionComponents';
import { useDatasetListPermissionUsers } from '@/api/buster-rest';
import { useDebounceSearch } from '@/hooks';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { useMemoizedFn } from 'ahooks';
import { PermissionListUsersContainer } from './PermissionListUsersContainer';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export const PermissionUsers: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const onToggleInviteModal = useAppLayoutContextSelector((x) => x.onToggleInviteModal);
  const { data: permissionUsers, isFetched: isPermissionUsersFetched } =
    useDatasetListPermissionUsers(datasetId);

  const { searchText, handleSearchChange, filteredItems } = useDebounceSearch({
    items: permissionUsers || [],
    searchPredicate: (item, searchText) => {
      const lowerCaseSearchText = searchText.toLowerCase();
      return (
        item.name.toLocaleLowerCase().includes(lowerCaseSearchText) ||
        item.email.toLocaleLowerCase().includes(lowerCaseSearchText)
      );
    }
  });

  const openInviteUserModal = useMemoizedFn(() => {
    onToggleInviteModal(true);
  });

  return (
    <>
      <HeaderExplanation
        className="mb-5"
        title="Dataset users"
        description="Manage who can build dashboards & metrics using this dataset"
      />
      <div className="flex h-full flex-col space-y-3 pb-12">
        <div className="flex items-center justify-between">
          <PermissionSearch
            searchText={searchText}
            setSearchText={handleSearchChange}
            placeholder="Search by permission group"
          />

          <Button
            type="default"
            icon={<AppMaterialIcons icon="add" />}
            onClick={openInviteUserModal}>
            Invite user
          </Button>
        </div>
        {isPermissionUsersFetched && (
          <PermissionListUsersContainer
            filteredPermissionUsers={filteredItems}
            datasetId={datasetId}
          />
        )}
      </div>
    </>
  );
});

PermissionUsers.displayName = 'PermissionUsers';