import { useUpdateUserPermissionGroups, type BusterUserPermissionGroup } from '@/api/buster_rest';
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
import { UserPermissionGroupSelectedPopup } from './UserPermissionGroupSelectedPopup';
import pluralize from 'pluralize';
import { Text } from '@/components/text';

export const UserPermissionGroupsListContainer: React.FC<{
  filteredPermissionGroups: BusterUserPermissionGroup[];
  userId: string;
}> = React.memo(({ filteredPermissionGroups, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserPermissionGroups } = useUpdateUserPermissionGroups({
    userId: userId
  });
  const numberOfPermissionGroups = filteredPermissionGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateUserPermissionGroups([params]);
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
        width: 130 + 145,
        render: (assigned: boolean, permissionGroup: BusterUserPermissionGroup) => {
          const { dataset_count } = permissionGroup;
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                text="assigned"
                onSelect={onSelectAssigned}>
                <Text type="secondary">{`${dataset_count} ${pluralize('datasets', dataset_count)}`}</Text>
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
    } = filteredPermissionGroups.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, permissionGroup) => {
        const permissionGroupItem: BusterListRowItem = {
          id: permissionGroup.id,
          data: permissionGroup,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS,
            permissionGroupId: permissionGroup.id
          })
        };
        if (permissionGroup.assigned) {
          acc.canQueryPermissionUsers.push(permissionGroupItem);
        } else {
          acc.cannotQueryPermissionUsers.push(permissionGroupItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [] as BusterListRowItem[],
        canQueryPermissionUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredPermissionGroups]);

  const rows = useMemo(
    () => [
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
    ],
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfPermissionGroups]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <UserPermissionGroupSelectedPopup
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
        emptyState={<EmptyStateList text="No permission groups found" />}
      />
    </InfiniteListContainer>
  );
});

UserPermissionGroupsListContainer.displayName = 'UserPermissionGroupsListContainer';
