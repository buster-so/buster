'use client';

import React from 'react';
import { useDatasetListPermissionUsers } from '@/api/buster_rest';
import { PermissionSearchAndListWrapper } from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/BusterAppLayout';
import { useDebounceSearch, useMemoizedFn } from '@/hooks';
import { PermissionListUsersContainer } from './PermissionListUsersContainer';

export const PermissionUsers: React.FC<{
  datasetId: string;
}> = React.memo(({ datasetId }) => {
  const onToggleInviteModal = useInviteModalStore((x) => x.onToggleInviteModal);
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
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by user"
        searchChildren={React.useMemo(
          () => (
            <Button prefix={<Plus />} onClick={openInviteUserModal}>
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
