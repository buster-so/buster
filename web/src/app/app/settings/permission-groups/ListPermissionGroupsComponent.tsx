import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import React, { useMemo } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { GetPermissionGroupResponse } from '@/api/buster_rest';

export const ListPermissionGroupsComponent: React.FC<{
  permissionGroups: GetPermissionGroupResponse[];
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
        rowClassName="!pl-[30px]"
        columnRowVariant="default"
        emptyState={<EmptyStateList text="No permission groups found" />}
      />
    </InfiniteListContainer>
  );
});

ListPermissionGroupsComponent.displayName = 'ListPermissionGroupsComponent';
