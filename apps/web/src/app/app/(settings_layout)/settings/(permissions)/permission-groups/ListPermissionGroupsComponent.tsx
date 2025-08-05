import React, { useMemo } from 'react';
import type { ListPermissionGroupsResponse } from '@/api/asset_interfaces';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const ListPermissionGroupsComponent: React.FC<{
  permissionGroups: ListPermissionGroupsResponse[];
  isFetched: boolean;
}> = React.memo(({ permissionGroups, isFetched }) => {
  const columns: BusterListColumn<ListPermissionGroupsResponse>[] = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'name'
      }
    ],
    []
  );

  const permissionGroupsRows: BusterListRowItem<ListPermissionGroupsResponse>[] = useMemo(() => {
    return permissionGroups.reduce<BusterListRowItem<ListPermissionGroupsResponse>[]>(
      (acc, permissionGroup) => {
        const rowItem: BusterListRowItem<ListPermissionGroupsResponse> = {
          id: permissionGroup.id,
          data: permissionGroup,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS,
            permissionGroupId: permissionGroup.id
          })
        };
        acc.push(rowItem);
        return acc;
      },
      []
    );
  }, [permissionGroups]);

  return (
    <InfiniteListContainer
      showContainerBorder={false}
      //   popupNode={
      //     <UserListPopupContainer
      //       selectedRowKeys={selectedRowKeys}
      //       onSelectChange={setSelectedRowKeys}
      //     />
      //   }
    >
      <BusterInfiniteList
        columns={columns}
        rows={permissionGroupsRows}
        showHeader={true}
        showSelectAll={false}
        rowClassName="pl-[30px]!"
        emptyState={useMemo(
          () => (
            <EmptyStateList text="No permission groups found" />
          ),
          []
        )}
      />
    </InfiniteListContainer>
  );
});

ListPermissionGroupsComponent.displayName = 'ListPermissionGroupsComponent';
