import { BusterUserDatasetGroup, useUpdateUserDatasetGroups } from '@/api/buster_rest';
import { PermissionAssignedCell } from '@/app/app/_components/PermissionComponents';
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
import { UserDatasetGroupSelectedPopup } from './UserDatasetGroupSelectedPopup';
import pluralize from 'pluralize';
import { Text } from '@/components/text';

export const UserDatasetGroupListContainer: React.FC<{
  filteredDatasetGroups: BusterUserDatasetGroup[];
  userId: string;
}> = React.memo(({ filteredDatasetGroups, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserDatasetGroups } = useUpdateUserDatasetGroups({
    userId: userId
  });
  const numberOfDatasetGroups = filteredDatasetGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateUserDatasetGroups([params]);
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
        width: 130 + 85,
        render: (assigned: boolean, permissionGroup: BusterUserDatasetGroup) => {
          const { permission_count } = permissionGroup;
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                text="assigned"
                onSelect={onSelectAssigned}>
                <Text type="secondary">{`${permission_count} ${pluralize('datasets', permission_count)}`}</Text>
              </PermissionAssignedCell>
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
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, datasetGroup) => {
        const user: BusterListRowItem = {
          id: datasetGroup.id,
          data: datasetGroup,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
            userId: datasetGroup.id
          })
        };
        if (datasetGroup.assigned) {
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
  }, [filteredDatasetGroups]);

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
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfDatasetGroups]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <UserDatasetGroupSelectedPopup
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
        emptyState={<EmptyStateList text="No dataset groups found" />}
      />
    </InfiniteListContainer>
  );
});

UserDatasetGroupListContainer.displayName = 'UserDatasetGroupListContainer';
