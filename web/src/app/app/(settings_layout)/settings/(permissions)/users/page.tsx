'use client';

import { useGetOrganizationUsers } from '@/api/buster_rest';
import { PermissionSearch } from '@/components/features/PermissionComponents';
import { InvitePeopleModal } from '@/components/features/modal/InvitePeopleModal';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useInviteModalStore } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { ListUsersComponent } from './ListUsersComponent';

export default function Page() {
  const userOrganization = useUserConfigContextSelector((x) => x.userOrganizations);
  const onToggleInviteModal = useInviteModalStore((s) => s.onToggleInviteModal);
  const openInviteModal = useInviteModalStore((s) => s.openInviteModal);
  const firstOrganizationId = userOrganization?.id || '';
  const { data: users, isFetched } = useGetOrganizationUsers(firstOrganizationId);

  const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
    items: users || [],
    searchPredicate: (item, searchText) =>
      item.email?.includes(searchText) || item.name?.includes(searchText)
  });

  const onCloseInviteModal = useMemoizedFn(() => onToggleInviteModal(false));

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="px-[30px] pt-[46px]">
          <SettingsPageHeader
            title="User management"
            description="Manage your organization's users and their permissions"
            type="alternate"
          />
          <div className="flex items-center justify-between">
            <PermissionSearch
              placeholder="Search users name or email..."
              searchText={searchText}
              setSearchText={handleSearchChange}
            />

            <Button prefix={<Plus />} onClick={() => onToggleInviteModal(true)}>
              Invite people
            </Button>
          </div>
        </div>

        <ListUsersComponent users={filteredItems} isFetched={isFetched} />
      </div>

      <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
    </>
  );
}
