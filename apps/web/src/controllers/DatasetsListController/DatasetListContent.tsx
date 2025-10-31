import type { ListDatasetObject, ListDatasetsResponse } from '@buster/server-shared';
import React, { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ArrowUpRight } from '@/components/ui/icons';
import {
  BusterList,
  type BusterListColumn,
  createListItem,
  ListEmptyStateWithButton,
} from '@/components/ui/list';
import { BUSTER_DOCS_QUICKSTART } from '@/config/externalRoutes';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatDate } from '@/lib/date';
import { DatasetSelectedOptionPopup } from './DatasetSelectedPopup';

const columns: BusterListColumn<ListDatasetObject>[] = [
  {
    title: 'Title',
    dataIndex: 'name',
  },
  {
    title: 'Last queried',
    dataIndex: 'updated_at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
    width: 140,
  },
  {
    title: 'Created at',
    dataIndex: 'created_at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
    width: 140,
  },
  {
    title: 'Data source',
    dataIndex: 'data_source',
    width: 105,
    render: (v) => v?.name,
  },
  {
    title: 'Status',
    dataIndex: 'enabled',
    width: 75,
    render: (_, record) => getStatusText(record as ListDatasetObject),
  },
  {
    title: 'Owner',
    dataIndex: 'owner',
    width: 60,
    render: (_, dataset: ListDatasetObject) => (
      <div className="flex w-full justify-start">
        <Avatar image={dataset.owner.avatar_url || undefined} name={dataset.owner.name} size={18} />
      </div>
    ),
  },
];

export const DatasetListContent: React.FC<{
  datasetsList: ListDatasetsResponse;
  isFetchedDatasets: boolean;
  isAdmin: boolean;
  setOpenNewDatasetModal: (open: boolean) => void;
}> = React.memo(({ datasetsList, isFetchedDatasets, isAdmin, setOpenNewDatasetModal }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const createDatasetLinkItem = createListItem<ListDatasetObject>();

  const rows = useMemo(() => {
    return datasetsList.map((dataset) => {
      return createDatasetLinkItem({
        id: dataset.id,
        data: dataset,
        link: {
          to: '/app/datasets/$datasetId',
          params: {
            datasetId: dataset.id,
          },
        },
      });
    });
  }, [datasetsList]);

  const onClickEmptyState = useMemoizedFn(() => {
    setOpenNewDatasetModal(true);
  });

  return (
    <>
      <BusterList
        columns={columns}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={useMemo(
          () =>
            !isFetchedDatasets ? null : (
              <ListEmptyStateWithButton
                isAdmin={isAdmin}
                title="You don't have any datasets yet."
                buttonText="Link to docs"
                link={BUSTER_DOCS_QUICKSTART}
                buttonPrefix={null}
                buttonSuffix={<ArrowUpRight />}
                linkButtonTarget="_blank"
                description="Datasets help you organize your data and Buster uses them to help answer questions. Datasets will appear here when you create them. Currently, you can only create datasets through our CLI tool which you can read more about in our docs."
              />
            ),
          [isFetchedDatasets, isAdmin, onClickEmptyState]
        )}
      />

      <DatasetSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
      />
    </>
  );
});

DatasetListContent.displayName = 'DatasetListContent';

const getStatusText = (d: ListDatasetObject) => {
  if (d.enabled) {
    return 'Published';
  }
  return 'Draft';
};
