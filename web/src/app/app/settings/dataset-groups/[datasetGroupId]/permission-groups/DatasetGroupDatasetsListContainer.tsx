import {
  GetDatasetGroupPermissionGroupsResponse,
  GetPermissionGroupDatasetGroupsResponse,
  useUpdateDatasetGroupPermissionGroups
} from '@/api/buster_rest';
import { PermissionAssignedCell } from '@appComponents/PermissionComponents';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { DatasetGroupDatasetGroupSelectedPopup } from './DatasetGroupDatasetSelectedPopup';

export const DatasetGroupDatasetGroupsListContainer: React.FC<{
  filteredDatasetGroups: GetDatasetGroupPermissionGroupsResponse[];
  datasetGroupId: string;
}> = React.memo(({ filteredDatasetGroups, datasetGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateDatasetGroupDatasetGroups } =
    useUpdateDatasetGroupPermissionGroups(datasetGroupId);

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroupDatasetGroups([params]);
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
      cannotQueryPermissionDatasetGroups: BusterListRowItem[];
      canQueryPermissionDatasetGroups: BusterListRowItem[];
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionDatasetGroups: BusterListRowItem[];
      canQueryPermissionDatasetGroups: BusterListRowItem[];
    }>(
      (acc, datasetGroup) => {
        const datasetGroupItem: BusterListRowItem = {
          id: datasetGroup.id,
          data: datasetGroup,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS,
            datasetGroupId: datasetGroup.id
          })
        };
        if (datasetGroup.assigned) {
          acc.canQueryPermissionDatasetGroups.push(datasetGroupItem);
        } else {
          acc.cannotQueryPermissionDatasetGroups.push(datasetGroupItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionDatasetGroups: [] as BusterListRowItem[],
        canQueryPermissionDatasetGroups: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredDatasetGroups]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-assigned',
          data: {},
          hidden: canQueryPermissionDatasetGroups.length === 0,
          rowSection: {
            title: 'Assigned',
            secondaryTitle: canQueryPermissionDatasetGroups.length.toString()
          }
        },
        ...canQueryPermissionDatasetGroups,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: cannotQueryPermissionDatasetGroups.length === 0,
          rowSection: {
            title: 'Not Assigned',
            secondaryTitle: cannotQueryPermissionDatasetGroups.length.toString()
          }
        },
        ...cannotQueryPermissionDatasetGroups
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionDatasetGroups, cannotQueryPermissionDatasetGroups]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <DatasetGroupDatasetGroupSelectedPopup
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
        emptyState={<EmptyStateList text="No dataset groups found" />}
      />
    </InfiniteListContainer>
  );
});

DatasetGroupDatasetGroupsListContainer.displayName = 'DatasetGroupDatasetGroupsListContainer';
