'use client';

import React, { useMemo, useState } from 'react';
import type {
  GetPermissionGroupDatasetsResponse,
  GetPermissionGroupUsersResponse
} from '@/api/asset_interfaces';
import { useUpdatePermissionGroupDatasets } from '@/api/buster_rest/permission_groups';
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
import { PermissionGroupDatasetSelectedPopup } from './PermissionGroupDatasetSelectedPopup';

export const PermissionGroupDatasetsListContainer: React.FC<{
  filteredDatasets: GetPermissionGroupDatasetsResponse[];
  permissionGroupId: string;
}> = React.memo(({ filteredDatasets, permissionGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updatePermissionGroupDatasets } = useUpdatePermissionGroupDatasets();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updatePermissionGroupDatasets({
      permissionGroupId,
      data: [params]
    });
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
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    } = filteredDatasets.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, dataset) => {
        const datasetItem: BusterListRowItem = {
          id: dataset.id,
          data: dataset,
          link: createBusterRoute({
            route: BusterRoutes.APP_DATASETS_ID,
            datasetId: dataset.id
          })
        };
        if (dataset.assigned) {
          acc.canQueryPermissionUsers.push(datasetItem);
        } else {
          acc.cannotQueryPermissionUsers.push(datasetItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [] as BusterListRowItem[],
        canQueryPermissionUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredDatasets]);

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
    [canQueryPermissionUsers, cannotQueryPermissionUsers]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionGroupDatasetSelectedPopup
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

PermissionGroupDatasetsListContainer.displayName = 'PermissionGroupUsersListContainer';
