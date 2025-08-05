'use client';

import pluralize from 'pluralize';
import React, { useMemo, useState } from 'react';
import type { BusterUserDatasetGroup } from '@/api/asset_interfaces';
import { useUpdateUserDatasetGroups } from '@/api/buster_rest/users/permissions';
import { PermissionAssignedCell } from '@/components/features/PermissionComponents';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { UserDatasetGroupSelectedPopup } from './UserDatasetGroupSelectedPopup';

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

  const columns: BusterListColumn<BusterUserDatasetGroup>[] = useMemo(
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
                <Text variant="secondary">{`${permission_count} ${pluralize('datasets', permission_count)}`}</Text>
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
      cannotQueryPermissionUsers: BusterListRowItem<BusterUserDatasetGroup>[];
      canQueryPermissionUsers: BusterListRowItem<BusterUserDatasetGroup>[];
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<BusterUserDatasetGroup>[];
      canQueryPermissionUsers: BusterListRowItem<BusterUserDatasetGroup>[];
    }>(
      (acc, datasetGroup) => {
        const user: BusterListRowItem<BusterUserDatasetGroup> = {
          id: datasetGroup.id,
          data: datasetGroup,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_USERS_ID,
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
        cannotQueryPermissionUsers: [],
        canQueryPermissionUsers: []
      }
    );
    return result;
  }, [filteredDatasetGroups]);

  const rows: BusterListRowItem<BusterUserDatasetGroup>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryPermissionUsers.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionUsers.length.toString()
        }
      },
      ...canQueryPermissionUsers,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryPermissionUsers.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionUsers.length.toString()
        }
      },
      ...cannotQueryPermissionUsers
    ],
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfDatasetGroups]
  );

  const emptyStateComponent = useMemo(() => <EmptyStateList text="No dataset groups found" />, []);

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
        emptyState={emptyStateComponent}
      />
    </InfiniteListContainer>
  );
});

UserDatasetGroupListContainer.displayName = 'UserDatasetGroupListContainer';
