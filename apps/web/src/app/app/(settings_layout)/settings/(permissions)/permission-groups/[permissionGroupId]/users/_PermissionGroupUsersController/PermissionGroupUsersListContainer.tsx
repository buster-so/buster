'use client';

import React, { useMemo, useState } from 'react';
import type { GetPermissionGroupUsersResponse } from '@/api/asset_interfaces';
import { useUpdatePermissionGroupUsers } from '@/api/buster_rest/permission_groups';
import { ListUserItem } from '@/components/features/list';
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
import { PermissionGroupUsersSelectedPopup } from './PermissionGroupUsersSelectedPopup';

export const PermissionGroupUsersListContainer: React.FC<{
  filteredUsers: GetPermissionGroupUsersResponse[];
  permissionGroupId: string;
}> = React.memo(({ filteredUsers, permissionGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updatePermissionGroupUsers } =
    useUpdatePermissionGroupUsers(permissionGroupId);

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updatePermissionGroupUsers([params]);
  });

  const columns: BusterListColumn<GetPermissionGroupUsersResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name: string, user: GetPermissionGroupUsersResponse) => {
          return <ListUserItem name={name} email={user.email} avatarURL={user.avatar_url} />;
        }
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 85,
        render: (assigned: boolean, permissionGroup: GetPermissionGroupUsersResponse) => {
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
      cannotQueryPermissionUsers: BusterListRowItem<GetPermissionGroupUsersResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetPermissionGroupUsersResponse>[];
    } = filteredUsers.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<GetPermissionGroupUsersResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetPermissionGroupUsersResponse>[];
    }>(
      (acc, user) => {
        const userItem: BusterListRowItem<GetPermissionGroupUsersResponse> = {
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

  const rows: BusterListRowItem<GetPermissionGroupUsersResponse>[] = useMemo(
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
        <PermissionGroupUsersSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          permissionGroupId={permissionGroupId}
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

PermissionGroupUsersListContainer.displayName = 'PermissionGroupUsersListContainer';
