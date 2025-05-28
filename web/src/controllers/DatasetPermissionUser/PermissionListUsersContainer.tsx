import type {
  ListPermissionGroupsResponse,
  ListPermissionUsersResponse
} from '@/api/asset_interfaces';
import { useDatasetUpdatePermissionUsers } from '@/api/buster_rest/datasets';
import { ListUserItem } from '@/components/features/list';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { Select } from '@/components/ui/select';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo, useState } from 'react';
import { PermissionUsersSelectedPopup } from './PermissionUsersSelectedPopup';
import { PERMISSION_USERS_OPTIONS } from './config';

export const PermissionListUsersContainer: React.FC<{
  filteredPermissionUsers: ListPermissionUsersResponse[];
  datasetId: string;
}> = React.memo(({ filteredPermissionUsers, datasetId }) => {
  const { mutateAsync: updatePermissionUsers } = useDatasetUpdatePermissionUsers(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfPermissionUsers = filteredPermissionUsers.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    updatePermissionUsers([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270,
        render: (name: string, user: ListPermissionUsersResponse) => {
          return <ListUserItem name={name} email={user.email} />;
        }
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        render: (assigned: boolean, permissionGroup: ListPermissionGroupsResponse) => {
          return (
            <div className="flex justify-end">
              <PermissionGroupAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
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
    } = filteredPermissionUsers.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, permissionUser) => {
        const user: BusterListRowItem = {
          id: permissionUser.id,
          data: permissionUser,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_USERS_ID,
            userId: permissionUser.id
          })
        };
        if (permissionUser.assigned) {
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
  }, [filteredPermissionUsers]);

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
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionUsers.length.toString()
        }
      },
      ...cannotQueryPermissionUsers
    ],
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfPermissionUsers]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionUsersSelectedPopup
          datasetId={datasetId}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
        />
      }>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        useRowClickSelectChange={false}
        emptyState={useMemo(() => <EmptyStateList text="No users found" />, [])}
      />
    </InfiniteListContainer>
  );
});

PermissionListUsersContainer.displayName = 'PermissionListUsersContainer';

const PermissionGroupAssignedCell: React.FC<{
  id: string;
  assigned: boolean;
  onSelect: (value: { id: string; assigned: boolean }) => void;
}> = ({ id, assigned, onSelect }) => {
  return (
    <div className="flex" onClick={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
      <Select
        items={PERMISSION_USERS_OPTIONS}
        value={assigned ? 'included' : 'not_included'}
        onChange={(value) => {
          onSelect({ id, assigned: value === 'included' });
        }}
      />
    </div>
  );
};
