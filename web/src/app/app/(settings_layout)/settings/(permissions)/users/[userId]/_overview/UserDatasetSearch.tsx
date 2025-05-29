import React from 'react';
import type { OrganizationUser } from '@/api/asset_interfaces';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import { useDebounceSearch } from '@/hooks';
import { UserDatasetListContainer } from './UserDatasetListContainer';

export const UserDatasetSearch = React.memo(({ user }: { user: OrganizationUser }) => {
  const { datasets } = user;
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasets,
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
  });

  return (
    <PermissionSearchAndListWrapper
      searchText={searchText}
      handleSearchChange={handleSearchChange}
      searchPlaceholder="Search by dataset name">
      <UserDatasetListContainer filteredDatasets={filteredItems} />
    </PermissionSearchAndListWrapper>
  );
});

UserDatasetSearch.displayName = 'UserDatasetSearch';
