'use client';

import React, { useMemo, useState } from 'react';
import type { ListPermissionGroupsResponse } from '@/api/asset_interfaces';
import { useDatasetUpdatePermissionGroups } from '@/api/buster_rest/datasets';
import { PermissionAssignedCell } from '@/components/features/PermissionComponents';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { InfiniteListContainer } from '@/components/ui/list/InfiniteListContainer';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { PermissionGroupSelectedPopup } from './PermissionGroupSelectedPopup';

export const PermissionListPermissionGroupContainer: React.FC<{
  filteredPermissionGroups: ListPermissionGroupsResponse[];
  datasetId: string;
}> = React.memo(({ filteredPermissionGroups, datasetId }) => {
  const { mutateAsync: updatePermissionGroups } = useDatasetUpdatePermissionGroups();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfPermissionGroups = filteredPermissionGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    updatePermissionGroups({
      dataset_id: datasetId,
      groups: [params]
    });
  });

  const columns: BusterListColumn<ListPermissionGroupsResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name, permissionGroup: ListPermissionGroupsResponse) => {
          return (
            <div className="flex items-center justify-between gap-x-2">
              <Text>{name}</Text>
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={permissionGroup.assigned}
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

  const { cannotQueryPermissionGroups, canQueryPermissionGroups } = useMemo(() => {
    const result: {
      cannotQueryPermissionGroups: BusterListRowItem<ListPermissionGroupsResponse>[];
      canQueryPermissionGroups: BusterListRowItem<ListPermissionGroupsResponse>[];
    } = filteredPermissionGroups.reduce<{
      cannotQueryPermissionGroups: BusterListRowItem<ListPermissionGroupsResponse>[];
      canQueryPermissionGroups: BusterListRowItem<ListPermissionGroupsResponse>[];
    }>(
      (acc, permissionGroup) => {
        if (permissionGroup.assigned) {
          acc.canQueryPermissionGroups.push({
            id: permissionGroup.id,
            data: permissionGroup
          });
        } else {
          acc.cannotQueryPermissionGroups.push({
            id: permissionGroup.id,
            data: permissionGroup
          });
        }
        return acc;
      },
      {
        cannotQueryPermissionGroups: [],
        canQueryPermissionGroups: []
      }
    );
    return result;
  }, [filteredPermissionGroups]);

  const rows: BusterListRowItem<ListPermissionGroupsResponse>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryPermissionGroups.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionGroups.length.toString()
        }
      },
      ...canQueryPermissionGroups,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryPermissionGroups.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionGroups.length.toString()
        }
      },
      ...cannotQueryPermissionGroups
    ],
    [canQueryPermissionGroups, cannotQueryPermissionGroups, numberOfPermissionGroups]
  );

  const emptyStateComponent = useMemo(
    () => <EmptyStateList text="No permission groups found" />,
    []
  );

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionGroupSelectedPopup
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
        emptyState={emptyStateComponent}
        useRowClickSelectChange={true}
      />
    </InfiniteListContainer>
  );
});

PermissionListPermissionGroupContainer.displayName = 'PermissionListTeamContainer';
