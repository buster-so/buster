'use client';

import React from 'react';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useGetOrganizationUsers } from '@/api/buster_rest';
import { useUserConfigContextSelector } from '@/context/Users';
import { ListUsersComponent } from './ListUsersComponent';
import { PermissionSearch } from '../../../_components/PermissionComponents';
import { Button } from 'antd';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {} from '@/components/icons';

export default function Page() {
  const userOrganization = useUserConfigContextSelector((x) => x.userOrganizations);
  const onToggleInviteModal = useAppLayoutContextSelector((x) => x.onToggleInviteModal);
  const firstOrganizationId = userOrganization?.id! || '';
  const { data: users, isFetched } = useGetOrganizationUsers(firstOrganizationId);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: users || [],
    searchPredicate: (item, searchText) =>
      item.email.includes(searchText) || item.name.includes(searchText)
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="px-[30px] pt-[46px]">
        <SettingsPageHeader
          title="User Management"
          description="Manage your organization's users and their permissions"
          type="alternate"
        />
        <div className="flex space-x-3">
          <PermissionSearch
            placeholder="Search users name or email..."
            searchText={searchText}
            setSearchText={handleSearchChange}
          />

          <Button type="default" onClick={() => onToggleInviteModal()}>
            Invite User
          </Button>
        </div>
      </div>

      <ListUsersComponent users={filteredItems} isFetched={isFetched} />
    </div>
  );
}
