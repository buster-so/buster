'use client';

import {
  useGetDatasetGroup,
  useGetUserAttributes,
  useGetUserDatasetGroups,
  useGetUserDatasets,
  useGetUserPermissionGroups
} from '@/api/buster_rest';
import { useDebounceSearch } from '@/hooks';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { UserAttributesListContainer } from './UserAttributesListContainer';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components/icons';

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
      <Button
        type="default"
        icon={<AppMaterialIcons icon="add" />}
        onClick={onOpenNewAttributeModal}>
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
