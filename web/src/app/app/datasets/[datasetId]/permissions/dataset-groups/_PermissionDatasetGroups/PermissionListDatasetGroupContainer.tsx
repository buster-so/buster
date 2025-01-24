import { ListDatasetGroupsResponse, useDatasetUpdateDatasetGroups } from '@/api/buster_rest';
import {
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { BusterInfiniteList } from '@/components/list/BusterInfiniteList';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { PermissionDatasetGroupSelectedPopup } from './PermissionDatasetGroupSelectedPopup';
import { PermissionAssignedCell } from '@appComponents/PermissionComponents';

export const PermissionListDatasetGroupContainer: React.FC<{
  filteredDatasetGroups: ListDatasetGroupsResponse[];
  datasetId: string;
}> = ({ filteredDatasetGroups, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const numberOfDatasetGroups = filteredDatasetGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroups([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        render: (assigned: boolean, datasetGroup: ListDatasetGroupsResponse) => {
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
          title: 'Not Assigned',
          secondaryTitle: cannotQueryPermissionGroups.length.toString()
        }
      },
      ...cannotQueryPermissionGroups
    ],
    [canQueryPermissionGroups, cannotQueryPermissionGroups, numberOfDatasetGroups]
  );

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
        emptyState={<EmptyStateList text="No dataset groups found" />}
      />
    </InfiniteListContainer>
  );
};
