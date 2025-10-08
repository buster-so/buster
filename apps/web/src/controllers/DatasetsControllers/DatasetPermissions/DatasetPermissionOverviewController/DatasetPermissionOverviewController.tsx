import React from 'react';
import { useGetDatasetPermissionsOverview } from '@/api/buster_rest/datasets';
import {
  HeaderExplanation,
  PermissionSearchAndListWrapper,
} from '@/components/features/permissions';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { PermissionListUserContainer } from './PermissionListUserContainer';

export const DatasetPermissionOverviewController: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const { data: datasetPermissionsOverview } = useGetDatasetPermissionsOverview(datasetId);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: datasetPermissionsOverview?.users || [],
    searchPredicate: (item, searchText) =>
      item.name.toLowerCase().includes(searchText) || item.email.toLowerCase().includes(searchText),
  });

  return (
    <>
      <HeaderExplanation className="mb-5" />
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
      >
        <PermissionListUserContainer filteredUsers={filteredItems} />
      </PermissionSearchAndListWrapper>
    </>
  );
});

DatasetPermissionOverviewController.displayName = 'PermissionOverview';
