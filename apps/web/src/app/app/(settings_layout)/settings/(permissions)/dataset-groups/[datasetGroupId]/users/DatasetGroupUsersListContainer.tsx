'use client';

import React, { useMemo, useState } from 'react';
import type {
  GetDatasetGroupUsersResponse,
  GetPermissionGroupUsersResponse
} from '@/api/asset_interfaces';
import { useUpdateDatasetGroupUsers } from '@/api/buster_rest/dataset_groups';
import { ListUserItem } from '@/components/features/list/ListUserItem';
import { PermissionAssignedCell } from '@/components/features/PermissionComponents';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { DatasetGroupUsersSelectedPopup } from './DatasetGroupUsersSelectedPopup';

export const DatasetGroupUsersListContainer: React.FC<{
  filteredUsers: GetDatasetGroupUsersResponse[];
  datasetGroupId: string;
}> = React.memo(({ filteredUsers, datasetGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateDatasetGroupUsers } = useUpdateDatasetGroupUsers();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroupUsers({
      datasetGroupId,
      data: [params]
    });
  });

  const columns: BusterListColumn<GetDatasetGroupUsersResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name, user) => {
          return (
            <ListUserItem name={name as string} email={user.email} avatarURL={user.avatar_url} />
          );
        }
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 85,
        render: (assigned: boolean, permissionGroup) => {
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
      cannotQueryPermissionUsers: BusterListRowItem<GetDatasetGroupUsersResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetDatasetGroupUsersResponse>[];
    } = filteredUsers.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<GetDatasetGroupUsersResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetDatasetGroupUsersResponse>[];
    }>(
      (acc, user) => {
        const userItem: BusterListRowItem<GetDatasetGroupUsersResponse> = {
          id: user.id,
          data: user,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_USERS_ID,
            userId: user.id
          })
        };
        if (user.assigned) {
          acc.canQueryPermissionUsers.push(userItem);
        } else {
          acc.cannotQueryPermissionUsers.push(userItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [],
        canQueryPermissionUsers: []
      }
    );
    return result;
  }, [filteredUsers]);

  const rows: BusterListRowItem<GetDatasetGroupUsersResponse>[] = useMemo(
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
    [canQueryPermissionUsers, cannotQueryPermissionUsers]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <DatasetGroupUsersSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          datasetGroupId={datasetGroupId}
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
        emptyState={useMemo(
          () => (
            <EmptyStateList text="No dataset groups found" />
          ),
          []
        )}
      />
    </InfiniteListContainer>
  );
});

DatasetGroupUsersListContainer.displayName = 'DatasetGroupUsersListContainer';
