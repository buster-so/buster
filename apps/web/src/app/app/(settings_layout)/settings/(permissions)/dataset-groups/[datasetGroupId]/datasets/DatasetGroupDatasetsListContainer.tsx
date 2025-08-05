'use client';

import React, { useMemo, useState } from 'react';
import type { GetDatasetGroupDatasetsResponse } from '@/api/asset_interfaces';
import { useUpdateDatasetGroupDatasets } from '@/api/buster_rest/dataset_groups';
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
import { DatasetGroupDatasetSelectedPopup } from './DatasetGroupDatasetSelectedPopup';

export const DatasetGroupDatasetsListContainer: React.FC<{
  filteredDatasets: GetDatasetGroupDatasetsResponse[];
  datasetGroupId: string;
}> = React.memo(({ filteredDatasets, datasetGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateDatasetGroupDatasets } = useUpdateDatasetGroupDatasets();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroupDatasets({
      datasetGroupId,
      groups: [params]
    });
  });

  const columns: BusterListColumn<GetDatasetGroupDatasetsResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 85,
        render: (assigned, permissionGroup) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned as boolean}
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
      cannotQueryPermissionUsers: BusterListRowItem<GetDatasetGroupDatasetsResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetDatasetGroupDatasetsResponse>[];
    } = filteredDatasets.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<GetDatasetGroupDatasetsResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetDatasetGroupDatasetsResponse>[];
    }>(
      (acc, dataset) => {
        const datasetItem: BusterListRowItem<GetDatasetGroupDatasetsResponse> = {
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
        cannotQueryPermissionUsers: [],
        canQueryPermissionUsers: []
      }
    );
    return result;
  }, [filteredDatasets]);

  const rows: BusterListRowItem<GetDatasetGroupDatasetsResponse>[] = useMemo(
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
        <DatasetGroupDatasetSelectedPopup
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

DatasetGroupDatasetsListContainer.displayName = 'DatasetGroupDatasetsListContainer';
