'use client';

import { useGetDatasetGroupUsers, useGetPermissionGroupUsers } from '@/api';
import { AppMaterialIcons } from '@/components';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionSearchAndListWrapper } from '@appComponents/PermissionComponents';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { DatasetGroupUsersListContainer } from './DatasetGroupUsersListContainer';

export const DatasetGroupUsersController: React.FC<{
  datasetGroupId: string;
}> = ({ datasetGroupId }) => {
  const { data } = useGetDatasetGroupUsers(datasetGroupId);
  const onToggleInviteModal = useAppLayoutContextSelector((x) => x.onToggleInviteModal);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: data || [],
    searchPredicate: (item, searchText) =>
      item.email.includes(searchText) || item.name.includes(searchText)
  });

  const NewUserButton: React.ReactNode = useMemo(() => {
    return (
      <Button
        type="default"
        icon={<AppMaterialIcons icon="add" />}
        onClick={() => onToggleInviteModal(true)}>
        Invite user
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by user name or email..."
        searchChildren={NewUserButton}>
        <DatasetGroupUsersListContainer
          filteredUsers={filteredItems}
          datasetGroupId={datasetGroupId}
        />
      </PermissionSearchAndListWrapper>
    </>
  );
};
