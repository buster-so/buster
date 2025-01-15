import { useGetDatasetPermissionsOverview } from '@/api/buster-rest/datasets';
import React from 'react';
import { HeaderExplanation } from '../HeaderExplanation';
import { PermissionSearch } from '../PermissionSearch';
import { PermissionListUserContainer } from './PermissionListUserContainer';
import { useDebounceSearch } from '@/hooks';

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
      <div className="flex h-full flex-col space-y-3">
        <PermissionSearch searchText={searchText} setSearchText={handleSearchChange} />
        <PermissionListUserContainer filteredUsers={filteredItems} />
      </div>
    </>
  );
});

PermissionOverview.displayName = 'PermissionOverview';
