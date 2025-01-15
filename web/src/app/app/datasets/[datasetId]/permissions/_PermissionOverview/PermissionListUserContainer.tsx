import React, { useMemo, useState } from 'react';
import { DatasetPermissionOverviewUser } from '@/api/buster-rest/datasets';
import { createStyles } from 'antd-style';
import { BusterUserAvatar, Text } from '@/components';
import { BusterListColumn, BusterListRowItem } from '@/components/list';
import { BusterInfiniteList } from '@/components/list/BusterInfiniteList/BusterInfiniteList';
import { PermissionLineage } from './PermissionLineage';

export const PermissionListUserContainer: React.FC<{
  className?: string;
  filteredUsers: DatasetPermissionOverviewUser[];
}> = React.memo(({ className = '', filteredUsers }) => {
  const { styles, cx } = useStyles();
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
          lineage: DatasetPermissionOverviewUser['lineage'],
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
        if (user.can_query) {
          acc.canQueryUsers.push({
            id: user.id,
            data: user
          });
        } else {
          acc.cannotQueryUsers.push({
            id: user.id,
            data: user
          });
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

  const rows = useMemo(
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
      <div className={cx('', styles.container)}>
        <BusterInfiniteList
          columns={columns}
          rows={rows}
          showHeader={false}
          showSelectAll={false}
          emptyState={
            <div className="py-12">
              <Text type="tertiary">No users found</Text>
            </div>
          }
        />
      </div>
    </>
  );
});
PermissionListUserContainer.displayName = 'PermissionListUserContainer';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    border: 0.5px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    overflow: hidden;
  `
}));

const UserInfoCell = React.memo(({ user }: { user: DatasetPermissionOverviewUser }) => {
  return (
    <div className="flex w-full items-center space-x-1.5">
      <div className="flex items-center space-x-2">
        <BusterUserAvatar size={18} name={user.name} />
      </div>

      <div className="flex flex-col space-y-0">
        <Text>{user.name}</Text>
        {user.email && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user.email}
          </Text>
        )}
      </div>
    </div>
  );
});
UserInfoCell.displayName = 'UserInfoCell';

const UserLineageCell = React.memo(({ user }: { user: DatasetPermissionOverviewUser }) => {
  return (
    <div className="flex items-center justify-end">
      <PermissionLineage lineage={user.lineage} canQuery={user.can_query} />
    </div>
  );
});
UserLineageCell.displayName = 'UserLineageCell';
