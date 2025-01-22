import {
  ListPermissionGroupsResponse,
  useDatasetUpdatePermissionGroups
} from '@/api/buster_rest/datasets';
import { BusterListColumn, BusterListRowItem } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { PermissionGroupSelectedPopup } from './PermissionGroupSelectedPopup';
import { BusterInfiniteList, InfiniteListContainer } from '@/components/list';
import { PermissionAssignedCell } from '@/app/app/_components/PermissionComponents';

export const PermissionListPermissionGroupContainer: React.FC<{
  filteredPermissionGroups: ListPermissionGroupsResponse[];
  datasetId: string;
}> = React.memo(({ filteredPermissionGroups, datasetId }) => {
  const { mutateAsync: updatePermissionGroups } = useDatasetUpdatePermissionGroups(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfPermissionGroups = filteredPermissionGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    updatePermissionGroups([params]);
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
        render: (assigned: boolean, permissionGroup: ListPermissionGroupsResponse) => {
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

  const { cannotQueryPermissionGroups, canQueryPermissionGroups } = useMemo(() => {
    const result: {
      cannotQueryPermissionGroups: BusterListRowItem[];
      canQueryPermissionGroups: BusterListRowItem[];
    } = filteredPermissionGroups.reduce<{
      cannotQueryPermissionGroups: BusterListRowItem[];
      canQueryPermissionGroups: BusterListRowItem[];
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
        cannotQueryPermissionGroups: [] as BusterListRowItem[],
        canQueryPermissionGroups: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredPermissionGroups]);

  const rows = useMemo(
    () =>
      [
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
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionGroups, cannotQueryPermissionGroups, numberOfPermissionGroups]
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
        emptyState={<EmptyState />}
        useRowClickSelectChange={true}
      />
    </InfiniteListContainer>
  );
});

PermissionListPermissionGroupContainer.displayName = 'PermissionListTeamContainer';

const EmptyState = React.memo(() => {
  return (
    <div className="py-12">
      <Text type="tertiary">No permission groups found</Text>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
