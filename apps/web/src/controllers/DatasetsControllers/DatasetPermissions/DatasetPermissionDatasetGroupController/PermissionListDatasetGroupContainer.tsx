import type React from 'react';
import { useMemo, useState } from 'react';
import type { ListDatasetGroupsResponse } from '@/api/asset_interfaces';
import { useDatasetUpdateDatasetGroups } from '@/api/buster_rest/datasets';
import { PermissionAssignedCell } from '@/components/features/permissions';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer,
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { PermissionDatasetGroupSelectedPopup } from './PermissionDatasetGroupSelectedPopup';

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
      groups: [params],
    });
  });

  const columns: BusterListColumn<ListDatasetGroupsResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (
          name: string | number | boolean | null | undefined,
          datasetGroup: ListDatasetGroupsResponse
        ) => {
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
        },
      },
    ],
    []
  );

  const { cannotQueryPermissionGroups, canQueryPermissionGroups } = useMemo(() => {
    const result: {
      cannotQueryPermissionGroups: BusterListRowItem<ListDatasetGroupsResponse>[];
      canQueryPermissionGroups: BusterListRowItem<ListDatasetGroupsResponse>[];
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionGroups: BusterListRowItem<ListDatasetGroupsResponse>[];
      canQueryPermissionGroups: BusterListRowItem<ListDatasetGroupsResponse>[];
    }>(
      (acc, datasetGroup) => {
        if (datasetGroup.assigned) {
          acc.canQueryPermissionGroups.push({
            id: datasetGroup.id,
            data: datasetGroup,
          });
        } else {
          acc.cannotQueryPermissionGroups.push({
            id: datasetGroup.id,
            data: datasetGroup,
          });
        }
        return acc;
      },
      {
        cannotQueryPermissionGroups: [],
        canQueryPermissionGroups: [],
      }
    );
    return result;
  }, [filteredDatasetGroups]);

  const rows: BusterListRowItem<ListDatasetGroupsResponse>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryPermissionGroups.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionGroups.length.toString(),
        },
      },
      ...canQueryPermissionGroups,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryPermissionGroups.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionGroups.length.toString(),
        },
      },
      ...cannotQueryPermissionGroups,
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
      }
    >
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
