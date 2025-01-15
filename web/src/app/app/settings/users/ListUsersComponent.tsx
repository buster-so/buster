import { useUpdateUser } from '@/api/buster-rest';
import { OrganizationUser } from '@/api/buster-rest/organizations/responseInterfaces';
import { BusterInfiniteList, BusterListColumn, BusterListRowItem } from '@/components/list';
import { Card } from 'antd';
import React, { useMemo } from 'react';
import { Text } from '@/components/text';
import { OrganizationUserRoleText } from './config';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const ListUsersComponent: React.FC<{
  users: OrganizationUser[];
  isFetched: boolean;
}> = ({ users, isFetched }) => {
  const { mutateAsync: updateUser } = useUpdateUser();
  // const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  // const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
  //   await updateUser(params);
  // });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
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
    () =>
      [
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
      ].filter((row) => !(row as any).hidden),
    [activeUsers, inactiveUsers]
  );

  return (
    <>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={true}
        showSelectAll={false}
        columnRowVariant="default"
        //  selectedRowKeys={selectedRowKeys}
        //  onSelectChange={setSelectedRowKeys}
        emptyState={
          isFetched && (
            <div className="mx-[30px] flex w-full items-center justify-center">
              <Card className="w-full py-24 text-center">
                <Text type="tertiary">No users found</Text>
              </Card>
            </div>
          )
        }
      />

      {/* <PermissionDatasetGroupSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        datasetId={datasetId}
      /> */}
    </>
  );
};
