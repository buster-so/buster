'use client';

import React, { useMemo } from 'react';
import type { OrganizationUser } from '@buster/server-shared/organization';
import { ListUserItem } from '@/components/features/list/ListUserItem';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { Text } from '@/components/ui/typography';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { OrganizationUserRoleText } from '@/lib/organization/translations';

export const ListUsersComponent: React.FC<{
  users: OrganizationUser[];
  isFetched: boolean;
}> = React.memo(({ users, isFetched }) => {
  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name: string, user: OrganizationUser) => {
          return <ListUserItem name={name} email={user.email} avatarURL={user.avatar_url} />;
        }
      },
      {
        title: 'Default access',
        dataIndex: 'role',
        width: 165,
        render: (role: OrganizationUser['role']) => {
          return <Text variant="secondary">{OrganizationUserRoleText[role].title}</Text>;
        }
      }
    ],
    []
  );

  const { activeUsers, inactiveUsers } = useMemo((): {
    activeUsers: BusterListRowItem[];
    inactiveUsers: BusterListRowItem[];
  } => {
    return users.reduce<{ activeUsers: BusterListRowItem[]; inactiveUsers: BusterListRowItem[] }>(
      (acc, user) => {
        const rowItem: BusterListRowItem = {
          id: user.id,
          data: user,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_USERS_ID,
            userId: user.id
          })
        };

        if (user.status === 'active') {
          acc.activeUsers.push(rowItem);
        } else {
          acc.inactiveUsers.push(rowItem);
        }

        return acc;
      },
      { activeUsers: [], inactiveUsers: [] }
    );
  }, [users]);

  const rows: BusterListRowItem[] = useMemo(
    () => [
      {
        id: 'header-active',
        data: {},
        hidden: users.length === 0,
        rowSection: {
          title: 'Active',
          secondaryTitle: activeUsers.length.toString()
        }
      },
      ...activeUsers,
      {
        id: 'header-inactive',
        data: {},
        hidden: inactiveUsers.length === 0,
        rowSection: {
          title: 'Inactive',
          secondaryTitle: inactiveUsers.length.toString()
        }
      },
      ...inactiveUsers
    ],
    [activeUsers, inactiveUsers]
  );

  const emptyStateComponent = useMemo(
    () => <EmptyStateList text="No users found" variant="card" show={isFetched} />,
    [isFetched]
  );

  return (
    <InfiniteListContainer showContainerBorder={false}>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={true}
        showSelectAll={false}
        rowClassName="pl-[30px]!"
        emptyState={emptyStateComponent}
      />
    </InfiniteListContainer>
  );
});

ListUsersComponent.displayName = 'ListUsersComponent';
