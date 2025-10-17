import React, { useMemo } from 'react';
import type { DatasetPermissionOverviewUser } from '@/api/asset_interfaces';
import { ListUserItem } from '@/components/features/list/ListUserItem';
import { PermissionLineageBreadcrumb } from '@/components/features/permissions';
import {
  type BusterListColumn,
  type BusterListRowItem,
  createListItem,
  EmptyStateList,
  InfiniteListContainer,
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';

export const PermissionListUserContainer: React.FC<{
  className?: string;
  filteredUsers: DatasetPermissionOverviewUser[];
}> = React.memo(({ filteredUsers }) => {
  const numberOfUsers = filteredUsers.length;

  const columns: BusterListColumn<DatasetPermissionOverviewUser>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (_value, user: DatasetPermissionOverviewUser) => {
          return (
            <div className="flex items-center justify-between space-x-2">
              <UserInfoCell user={user} />
              <UserLineageCell user={user} />
            </div>
          );
        },
      },
    ],
    []
  );

  const { cannotQueryUsers, canQueryUsers } = useMemo(() => {
    const createUserListItem = createListItem<DatasetPermissionOverviewUser>();
    const result: {
      cannotQueryUsers: BusterListRowItem<DatasetPermissionOverviewUser>[];
      canQueryUsers: BusterListRowItem<DatasetPermissionOverviewUser>[];
    } = filteredUsers.reduce<{
      cannotQueryUsers: BusterListRowItem<DatasetPermissionOverviewUser>[];
      canQueryUsers: BusterListRowItem<DatasetPermissionOverviewUser>[];
    }>(
      (acc, user) => {
        const userRow: BusterListRowItem<DatasetPermissionOverviewUser> = createUserListItem({
          id: user.id,
          data: user,
          link: {
            to: '/app/settings/users/$userId',
            params: {
              userId: user.id,
            },
          },
        });

        if (user.can_query) {
          acc.canQueryUsers.push(userRow);
        } else {
          acc.cannotQueryUsers.push(userRow);
        }
        return acc;
      },
      {
        cannotQueryUsers: [],
        canQueryUsers: [],
      }
    );
    return result;
  }, [filteredUsers]);

  const rows: BusterListRowItem<DatasetPermissionOverviewUser>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryUsers.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: numberOfUsers.toString(),
        },
      },
      ...canQueryUsers,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryUsers.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryUsers.length.toString(),
        },
      },
      ...cannotQueryUsers,
    ],
    [canQueryUsers, cannotQueryUsers, numberOfUsers]
  );

  return (
    <InfiniteListContainer>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        emptyState={useMemo(() => <EmptyStateList text="No users found" />, [])}
      />
    </InfiniteListContainer>
  );
});
PermissionListUserContainer.displayName = 'PermissionListUserContainer';

const UserInfoCell = React.memo(({ user }: { user: DatasetPermissionOverviewUser }) => {
  return <ListUserItem name={user.name} email={user.email} avatarURL={user.avatar_url} />;
});
UserInfoCell.displayName = 'UserInfoCell';

const UserLineageCell = React.memo(({ user }: { user: DatasetPermissionOverviewUser }) => {
  return (
    <div className="flex items-center justify-end">
      <PermissionLineageBreadcrumb lineage={user.lineage} canQuery={user.can_query} />
    </div>
  );
});
UserLineageCell.displayName = 'UserLineageCell';
