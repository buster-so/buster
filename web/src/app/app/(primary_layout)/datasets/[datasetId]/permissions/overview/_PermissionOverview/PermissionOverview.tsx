'use client';

import { useGetDatasetPermissionsOverview } from '@/api/buster_rest/datasets';
import {
  HeaderExplanation,
  PermissionSearchAndListWrapper
} from '@/components/features/PermissionComponents';
import { useDebounceSearch } from '@/hooks';
import React from 'react';
import { PermissionListUserContainer } from './PermissionListUserContainer';

export const PermissionOverview: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { data: datasetPermissionsOverview } = useGetDatasetPermissionsOverview(datasetId);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasetPermissionsOverview?.users || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText) || item.email.toLowerCase().includes(searchText)
  });

  return (
    <>
      <HeaderExplanation className="mb-5" />
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}>
        <PermissionListUserContainer filteredUsers={filteredItems} />
      </PermissionSearchAndListWrapper>
    </>
  );
});

PermissionOverview.displayName = 'PermissionOverview';
