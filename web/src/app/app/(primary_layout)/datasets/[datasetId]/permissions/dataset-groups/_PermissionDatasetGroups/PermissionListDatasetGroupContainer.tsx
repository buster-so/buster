'use client';

import type { ListDatasetGroupsResponse } from '@/api/asset_interfaces';
import { useDatasetUpdateDatasetGroups } from '@/api/buster_rest';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { useMemoizedFn } from '@/hooks';
import type React from 'react';
import { useMemo, useState } from 'react';
import { PermissionDatasetGroupSelectedPopup } from './PermissionDatasetGroupSelectedPopup';
import { PermissionAssignedCell } from '@/components/features/PermissionComponents';
import { Text } from '@/components/ui/typography';

export const PermissionListDatasetGroupContainer: React.FC<{
  filteredDatasetGroups: ListDatasetGroupsResponse[];
  datasetId: string;
}> = ({ filteredDatasetGroups, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const numberOfDatasetGroups = filteredDatasetGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroups({
      dataset_id: datasetId,
      groups: [params]
    });
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name: string, datasetGroup: ListDatasetGroupsResponse) => {
          return (
            <div className="flex items-center justify-between gap-x-2">
              <Text>{name}</Text>
              <PermissionAssignedCell
                id={datasetGroup.id}
                assigned={datasetGroup.assigned}
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
      cannotQueryPermissionGroups: BusterListRowItem[];
      canQueryPermissionGroups: BusterListRowItem[];
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionGroups: BusterListRowItem[];
      canQueryPermissionGroups: BusterListRowItem[];
    }>(
      (acc, datasetGroup) => {
        if (datasetGroup.assigned) {
          acc.canQueryPermissionGroups.push({
            id: datasetGroup.id,
            data: datasetGroup
          });
        } else {
          acc.cannotQueryPermissionGroups.push({
            id: datasetGroup.id,
            data: datasetGroup
          });
        }
        return acc;
      },
      {
        cannotQueryPermissionGroups: [] as BusterListRowItem[],
        canQueryPermissionGroups: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredDatasetGroups]);

  const rows = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: {},
        hidden: canQueryPermissionGroups.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionGroups.length.toString()
        }
      },
      ...canQueryPermissionGroups,
      {
        id: 'header-not-assigned',
        data: {},
        hidden: cannotQueryPermissionGroups.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionGroups.length.toString()
        }
      },
      ...cannotQueryPermissionGroups
    ],
    [canQueryPermissionGroups, cannotQueryPermissionGroups, numberOfDatasetGroups]
  );

  const emptyStateComponent = useMemo(() => <EmptyStateList text="No dataset groups found" />, []);

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionDatasetGroupSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          datasetId={datasetId}
        />
      }>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={true}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={emptyStateComponent}
      />
    </InfiniteListContainer>
  );
};
