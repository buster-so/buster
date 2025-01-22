import {
  BusterUserDataset,
  useUpdateUserDatasets,
  type BusterUserPermissionGroup
} from '@/api/buster_rest';
import { PermissionAssignedCell } from '@appComponents/PermissionComponents';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { UserDatasetsSelectedPopup } from './UserDatasetsSelectedPopup';
import pluralize from 'pluralize';

export const UserDatasetsListContainer: React.FC<{
  filteredDatasets: BusterUserDataset[];
  userId: string;
}> = React.memo(({ filteredDatasets, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserDatasets } = useUpdateUserDatasets({
    userId: userId
  });

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateUserDatasets([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130,
        render: (assigned: boolean, permissionGroup: BusterUserPermissionGroup) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                text="assigned"
                onSelect={onSelectAssigned}
              />
            </div>
          );
        }
      }
    ],
    []
  );

  const { cannotQueryPermissionUsers, canQueryPermissionUsers } = useMemo(() => {
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    } = filteredDatasets.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, dataset) => {
        const user: BusterListRowItem = {
          id: dataset.id,
          data: dataset,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
            userId: dataset.id
          })
        };
        if (dataset.assigned) {
          acc.canQueryPermissionUsers.push(user);
        } else {
          acc.cannotQueryPermissionUsers.push(user);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [] as BusterListRowItem[],
        canQueryPermissionUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredDatasets]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-assigned',
          data: {},
          hidden: canQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Assigned',
            secondaryTitle: canQueryPermissionUsers.length.toString()
          }
        },
        ...canQueryPermissionUsers,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: cannotQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Not Assigned',
            secondaryTitle: cannotQueryPermissionUsers.length.toString()
          }
        },
        ...cannotQueryPermissionUsers
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionUsers, cannotQueryPermissionUsers]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <UserDatasetsSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          userId={userId}
        />
      }>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={<EmptyStateList text="No datasets found" />}
      />
    </InfiniteListContainer>
  );
});

UserDatasetsListContainer.displayName = 'UserDatasetsListContainer';
