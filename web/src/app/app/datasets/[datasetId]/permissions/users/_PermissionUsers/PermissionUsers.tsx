'use client';

import React from 'react';
import {
  PermissionSearch,
  PermissionSearchAndListWrapper,
  HeaderExplanation
} from '@/app/app/_components/PermissionComponents';
import { useDatasetListPermissionUsers } from '@/api/buster_rest';
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

      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by permission group"
        searchChildren={React.useMemo(
          () => (
            <Button
              type="default"
              icon={<AppMaterialIcons icon="add" />}
              onClick={openInviteUserModal}>
              Invite user
            </Button>
          ),
          [openInviteUserModal]
        )}>
        {isPermissionUsersFetched && (
          <PermissionListUsersContainer
            filteredPermissionUsers={filteredItems}
            datasetId={datasetId}
          />
        )}
      </PermissionSearchAndListWrapper>
    </>
  );
});

PermissionUsers.displayName = 'PermissionUsers';
