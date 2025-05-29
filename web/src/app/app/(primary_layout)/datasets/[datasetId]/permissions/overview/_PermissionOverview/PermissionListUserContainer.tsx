'use client';

import React, { useMemo } from 'react';
import type { DatasetPermissionOverviewUser } from '@/api/asset_interfaces';
import { ListUserItem } from '@/components/features/list';
import { PermissionLineageBreadcrumb } from '@/components/features/PermissionComponents';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const PermissionListUserContainer: React.FC<{
  className?: string;
  filteredUsers: DatasetPermissionOverviewUser[];
}> = React.memo(({ className = '', filteredUsers }) => {
  const numberOfUsers = filteredUsers.length;

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (value, user: DatasetPermissionOverviewUser) => {
          return (
            <div className="flex items-center justify-between space-x-2">
              <UserInfoCell user={user} />
              <UserLineageCell user={user} />
            </div>
          );
        }
      }
    ],
    []
  );

  const { cannotQueryUsers, canQueryUsers } = useMemo(() => {
    const result: {
      cannotQueryUsers: BusterListRowItem[];
      canQueryUsers: BusterListRowItem[];
    } = filteredUsers.reduce<{
      cannotQueryUsers: BusterListRowItem[];
      canQueryUsers: BusterListRowItem[];
    }>(
      (acc, user) => {
        const userRow: BusterListRowItem = {
          id: user.id,
          data: user,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_USERS_ID,
            userId: user.id
          })
        };

        if (user.can_query) {
          acc.canQueryUsers.push(userRow);
        } else {
          acc.cannotQueryUsers.push(userRow);
        }
        return acc;
      },
      {
        cannotQueryUsers: [] as BusterListRowItem[],
        canQueryUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredUsers]);

  const rows: BusterListRowItem[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: {},
        hidden: canQueryUsers.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: numberOfUsers.toString()
        }
      },
      ...canQueryUsers,
      {
        id: 'header-not-assigned',
        data: {},
        hidden: cannotQueryUsers.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryUsers.length.toString()
        }
      },
      ...cannotQueryUsers
    ],
    [canQueryUsers, cannotQueryUsers, numberOfUsers]
  );

  return (
    <>
      <InfiniteListContainer>
        <BusterInfiniteList
          columns={columns}
          rows={rows}
          showHeader={false}
          showSelectAll={false}
          emptyState={useMemo(() => <EmptyStateList text="No users found" />, [])}
        />
      </InfiniteListContainer>
    </>
  );
});
PermissionListUserContainer.displayName = 'PermissionListUserContainer';

const UserInfoCell = React.memo(({ user }: { user: DatasetPermissionOverviewUser }) => {
  return <ListUserItem name={user.name} email={user.email} />;
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
