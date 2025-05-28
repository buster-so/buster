import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import React, { useMemo } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { ListPermissionGroupsResponse } from '@/api/asset_interfaces';

export const ListPermissionGroupsComponent: React.FC<{
  permissionGroups: ListPermissionGroupsResponse[];
  isFetched: boolean;
}> = React.memo(({ permissionGroups, isFetched }) => {
  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'name'
      }
    ],
    []
  );

  const permissionGroupsRows: BusterListRowItem[] = useMemo(() => {
    return permissionGroups.reduce<BusterListRowItem[]>((acc, permissionGroup) => {
      const rowItem: BusterListRowItem = {
        id: permissionGroup.id,
        data: permissionGroup,
        link: createBusterRoute({
          route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS,
          permissionGroupId: permissionGroup.id
        })
      };
      acc.push(rowItem);
      return acc;
    }, []);
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
