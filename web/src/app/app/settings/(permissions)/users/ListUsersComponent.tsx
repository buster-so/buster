import { OrganizationUser } from '@/api/buster_rest/organizations/responseInterfaces';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { Card } from 'antd';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { OrganizationUserRoleText } from './config';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { ListUserItem } from '../../../_components/ListContent';

export const ListUsersComponent: React.FC<{
  users: OrganizationUser[];
  isFetched: boolean;
}> = React.memo(({ users, isFetched }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name: string, user: OrganizationUser) => {
          return <ListUserItem name={name} email={user.email} />;
        }
      },
      {
        title: 'Default access',
        dataIndex: 'role',
        width: 165,
        render: (role: OrganizationUser['role']) => {
          return <Text type="secondary">{OrganizationUserRoleText[role]}</Text>;
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
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
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

  return (
    <InfiniteListContainer showContainerBorder={false}>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={true}
        showSelectAll={false}
        rowClassName="!pl-[30px]"
        // onSelectChange={setSelectedRowKeys}
        // selectedRowKeys={selectedRowKeys}
        columnRowVariant="default"
        emptyState={<EmptyStateList text="No users found" variant="card" show={isFetched} />}
      />
    </InfiniteListContainer>
  );
});

ListUsersComponent.displayName = 'ListUsersComponent';
