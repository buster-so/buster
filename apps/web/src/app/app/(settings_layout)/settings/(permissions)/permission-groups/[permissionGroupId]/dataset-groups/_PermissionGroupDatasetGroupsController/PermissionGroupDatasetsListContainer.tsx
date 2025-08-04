'use client';

import React, { useMemo, useState } from 'react';
import type { GetPermissionGroupDatasetGroupsResponse } from '@/api/asset_interfaces';
import { useUpdatePermissionGroupDatasetGroups } from '@/api/buster_rest/permission_groups';
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
import { PermissionGroupDatasetGroupSelectedPopup } from './PermissionGroupDatasetSelectedPopup';

export const PermissionGroupDatasetGroupsListContainer: React.FC<{
  filteredDatasetGroups: GetPermissionGroupDatasetGroupsResponse[];
  permissionGroupId: string;
}> = React.memo(({ filteredDatasetGroups, permissionGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updatePermissionGroupDatasetGroups } =
    useUpdatePermissionGroupDatasetGroups(permissionGroupId);

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updatePermissionGroupDatasetGroups([params]);
  });

  const columns: BusterListColumn<GetPermissionGroupDatasetGroupsResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 85,
        render: (assigned: boolean, datasetGroup: GetPermissionGroupDatasetGroupsResponse) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={datasetGroup.id}
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

  const { cannotQueryPermissionDatasetGroups, canQueryPermissionDatasetGroups } = useMemo(() => {
    const result: {
      cannotQueryPermissionDatasetGroups: BusterListRowItem<GetPermissionGroupDatasetGroupsResponse>[];
      canQueryPermissionDatasetGroups: BusterListRowItem<GetPermissionGroupDatasetGroupsResponse>[];
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionDatasetGroups: BusterListRowItem<GetPermissionGroupDatasetGroupsResponse>[];
      canQueryPermissionDatasetGroups: BusterListRowItem<GetPermissionGroupDatasetGroupsResponse>[];
    }>(
      (acc, permissionGroupDatasetGroup) => {
        const permissionGroupDatasetGroupItem: BusterListRowItem<GetPermissionGroupDatasetGroupsResponse> =
          {
            id: permissionGroupDatasetGroup.id,
            data: permissionGroupDatasetGroup,
            link: createBusterRoute({
              route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS,
              permissionGroupId: permissionGroupId
            })
          };
        if (permissionGroupDatasetGroup.assigned) {
          acc.canQueryPermissionDatasetGroups.push(permissionGroupDatasetGroupItem);
        } else {
          acc.cannotQueryPermissionDatasetGroups.push(permissionGroupDatasetGroupItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionDatasetGroups: [],
        canQueryPermissionDatasetGroups: []
      }
    );
    return result;
  }, [filteredDatasetGroups]);

  const rows: BusterListRowItem<GetPermissionGroupDatasetGroupsResponse>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryPermissionDatasetGroups.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionDatasetGroups.length.toString()
        }
      },
      ...canQueryPermissionDatasetGroups,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryPermissionDatasetGroups.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionDatasetGroups.length.toString()
        }
      },
      ...cannotQueryPermissionDatasetGroups
    ],
    [canQueryPermissionDatasetGroups, cannotQueryPermissionDatasetGroups]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionGroupDatasetGroupSelectedPopup
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

PermissionGroupDatasetGroupsListContainer.displayName = 'PermissionGroupDatasetGroupsListContainer';
