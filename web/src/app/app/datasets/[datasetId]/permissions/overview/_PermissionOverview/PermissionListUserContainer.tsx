import React, { useMemo, useState } from 'react';
import { DatasetPermissionOverviewUser } from '@/api/buster_rest/datasets';
import { BusterUserAvatar, Text } from '@/components';
import { BusterListColumn, BusterListRowItem, InfiniteListContainer } from '@/components/list';
import { BusterInfiniteList } from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { PermissionLineageBreadcrumb } from '../../../../../_components/PermissionComponents';
import { ListUserItem } from '@/app/app/_components/ListContent';

export const PermissionListUserContainer: React.FC<{
  className?: string;
  filteredUsers: DatasetPermissionOverviewUser[];
}> = React.memo(({ className = '', filteredUsers }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfUsers = filteredUsers.length;

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 290,
        render: (_: string, user: DatasetPermissionOverviewUser) => {
          return <UserInfoCell user={user} />;
        }
      },
      {
        title: 'Lineage',
        dataIndex: 'lineage',
        render: (
          _: DatasetPermissionOverviewUser['lineage'],
          user: DatasetPermissionOverviewUser
        ) => {
          return <UserLineageCell user={user} />;
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
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
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
    () =>
      [
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
            title: 'Not Assigned',
            secondaryTitle: cannotQueryUsers.length.toString()
          }
        },
        ...cannotQueryUsers
      ].filter((row) => !(row as any).hidden),
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
          emptyState={<EmptyState />}
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

const EmptyState = React.memo(() => {
  return (
    <div className="py-12">
      <Text type="tertiary">No users found</Text>
    </div>
  );
});
EmptyState.displayName = 'EmptyState';
