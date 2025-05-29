'use client';

import {
  useGetDatasetGroup,
  useGetUserAttributes,
  useGetUserDatasetGroups,
  useGetUserDatasets,
  useGetUserPermissionGroups
} from '@/api/buster_rest';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@/components/features/PermissionComponents';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks';
import { useMemoizedFn } from '@/hooks';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserAttributesListContainer } from './UserAttributesListContainer';

export const UserAttributesController: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: attributes } = useGetUserAttributes({ userId });
  const [isNewAttributeModalOpen, setIsNewAttributeModalOpen] = useState(false);
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: attributes || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText)
  });

  const onCloseNewAttributeModal = useMemoizedFn(() => {
    setIsNewAttributeModalOpen(false);
  });

  const onOpenNewAttributeModal = useMemoizedFn(() => {
    setIsNewAttributeModalOpen(true);
  });

  const NewAttributeButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewAttributeModal}>
        New attribute
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by attribute"
        //  searchChildren={NewAttributeButton}
      >
        <UserAttributesListContainer filteredAttributes={filteredItems} userId={userId} />
      </PermissionSearchAndListWrapper>

      <NewPermissionGroupModal
        isOpen={isNewAttributeModalOpen}
        onClose={onCloseNewAttributeModal}
        datasetId={null}
      />
    </>
  );
};
