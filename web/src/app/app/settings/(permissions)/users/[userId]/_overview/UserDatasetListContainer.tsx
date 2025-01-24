import React, { useMemo } from 'react';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { OrganizationUserDataset } from '@/api/buster_rest';
import { PermissionLineageBreadcrumb } from '@appComponents/PermissionComponents';

export const UserDatasetListContainer = React.memo(
  ({ filteredDatasets }: { filteredDatasets: OrganizationUserDataset[] }) => {
    const columns: BusterListColumn[] = useMemo(
      () => [
        {
          title: 'Name',
          dataIndex: 'name',
          width: 290
        },
        {
          title: '',
          dataIndex: 'datasets',
          render: (_: string, dataset: OrganizationUserDataset) => {
            return <DatasetLineageCell dataset={dataset} />;
          }
        }
      ],
      []
    );

    const { canQuery, cannotQuery, disabled } = useMemo(() => {
      const results: {
        canQuery: BusterListRowItem[];
        cannotQuery: BusterListRowItem[];
        disabled: BusterListRowItem[];
      } = filteredDatasets.reduce<{
        canQuery: BusterListRowItem[];
        cannotQuery: BusterListRowItem[];
        disabled: BusterListRowItem[];
      }>(
        (acc, dataset) => {
          const datasetItem: BusterListRowItem = {
            id: dataset.id,
            data: dataset
          };

          if (dataset.can_query) {
            acc.canQuery.push(datasetItem);
          } else {
            acc.cannotQuery.push(datasetItem);
          }

          return acc;
        },
        { canQuery: [], cannotQuery: [], disabled: [] }
      );

      return results;
    }, [filteredDatasets]);

    const rows: BusterListRowItem[] = useMemo(() => {
      return [
        {
          id: 'header-can-query',
          data: {},
          hidden: canQuery.length === 0,
          rowSection: {
            title: 'Can query',
            secondaryTitle: canQuery.length.toString()
          }
        },
        ...canQuery,
        {
          id: 'header-cannot-query',
          data: {},
          hidden: cannotQuery.length === 0,
          rowSection: {
            title: 'Cannot Query',
            secondaryTitle: cannotQuery.length.toString()
          }
        },
        ...cannotQuery,
        {
          id: 'header-disabled',
          data: {},
          hidden: disabled.length === 0,
          rowSection: {
            title: 'Disabled',
            secondaryTitle: disabled.length.toString()
          }
        },
        ...disabled
      ].filter((row) => !row.hidden);
    }, [canQuery, cannotQuery, disabled]);

    return (
      <InfiniteListContainer>
        <BusterInfiniteList
          columns={columns}
          rows={rows}
          showHeader={false}
          showSelectAll={false}
          emptyState={<EmptyStateList text="No datasets found" />}
        />
      </InfiniteListContainer>
    );
  }
);

UserDatasetListContainer.displayName = 'UserDatasetListContainer';

const DatasetLineageCell = React.memo(({ dataset }: { dataset: OrganizationUserDataset }) => {
  return (
    <div className="flex items-center justify-end">
      <PermissionLineageBreadcrumb lineage={dataset.lineage} canQuery={dataset.can_query} />
    </div>
  );
});
DatasetLineageCell.displayName = 'DatasetLineageCell';
