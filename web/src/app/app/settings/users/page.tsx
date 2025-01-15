'use client';

import React from 'react';
import { SettingsPageHeader } from '../_SettingsPageHeader';
import { SearchUsers } from './SearchUsers';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useGetUsers } from '@/api/buster-rest/users';

export default function Page() {
  const { data: users, isFetched } = useGetUsers();

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: users || [],
    searchPredicate: (item, searchText) => true
  });

  console.log('users', users);

  return (
    <div>
      <SettingsPageHeader
        title="User Management"
        description="Manage your organization's users and their permissions"
        type="alternate"
      />
      <SearchUsers onChange={handleSearchChange} />
    </div>
  );
}
