import React, { useMemo } from 'react';
import type { DatasetGroup } from '@/api/asset_interfaces';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const ListDatasetGroupsComponent: React.FC<{
  datasetGroups: DatasetGroup[];
  isFetched: boolean;
}> = React.memo(({ datasetGroups, isFetched }) => {
  const columns: BusterListColumn<DatasetGroup>[] = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'name'
      }
    ],
    []
  );

  const datasetGroupsRows: BusterListRowItem<DatasetGroup>[] = useMemo(() => {
    return datasetGroups.map((datasetGroup) => ({
      id: datasetGroup.id,
      data: datasetGroup,
      link: createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASET_GROUPS_ID_DATASETS,
        datasetGroupId: datasetGroup.id
      })
    }));
  }, [datasetGroups]);

  const emptyStateComponent = useMemo(() => <EmptyStateList text="No dataset groups found" />, []);

  return (
    <InfiniteListContainer
      showContainerBorder={false}
      //   popupNode={
      //     <UserListPopupContainer
      //       selectedRowKeys={selectedRowKeys}
      //       onSelectChange={setSelectedRowKeys}
      //     />
      //   }
    >
      <BusterInfiniteList
        columns={columns}
        rows={datasetGroupsRows}
        showHeader={true}
        showSelectAll={false}
        rowClassName="pl-[30px]!"
        emptyState={emptyStateComponent}
      />
    </InfiniteListContainer>
  );
});

ListDatasetGroupsComponent.displayName = 'ListDatasetGroupsComponent';
