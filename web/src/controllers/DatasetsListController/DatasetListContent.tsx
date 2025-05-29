'use client';

import type { BusterDatasetListItem } from '@/api/asset_interfaces';
import { Avatar } from '@/components/ui/avatar';
import { ArrowUpRight } from '@/components/ui/icons';
import { BusterList, type BusterListColumn, type BusterListRow } from '@/components/ui/list';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib';
import { BUSTER_DOCS_QUICKSTART, BusterRoutes, createBusterRoute } from '@/routes';
import React, { useState, useMemo } from 'react';
import { DatasetSelectedOptionPopup } from './DatasetSelectedPopup';

const columns: BusterListColumn[] = [
  {
    title: 'Title',
    dataIndex: 'name'
  },
  {
    title: 'Last queried',
    dataIndex: 'updated_at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
    width: 140
  },
  {
    title: 'Created at',
    dataIndex: 'created_at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
    width: 140
  },
  {
    title: 'Data source',
    dataIndex: 'data_source.name',
    width: 105
  },
  {
    title: 'Status',
    dataIndex: 'enabled',
    width: 75,
    render: (_, record) => getStatusText(record as BusterDatasetListItem)
  },
  {
    title: 'Owner',
    dataIndex: 'created_by_name',
    width: 60,
    render: (_, dataset: BusterDatasetListItem) => (
      <div className="flex w-full justify-start">
        <Avatar image={dataset.owner.avatar_url || undefined} name={dataset.owner.name} size={18} />
      </div>
    )
  }
];

export const DatasetListContent: React.FC<{
  datasetsList: BusterDatasetListItem[];
  isFetchedDatasets: boolean;
  isAdmin: boolean;
  setOpenNewDatasetModal: (open: boolean) => void;
}> = React.memo(({ datasetsList, isFetchedDatasets, isAdmin, setOpenNewDatasetModal }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const rows: BusterListRow[] = useMemo(() => {
    return datasetsList.map((dataset) => {
      return {
        id: dataset.id,
        data: dataset,
        link: createBusterRoute({
          route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
          datasetId: dataset.id
        })
      };
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
            !isFetchedDatasets ? (
              <></>
            ) : (
              <ListEmptyStateWithButton
                isAdmin={isAdmin}
                title="You don't have any datasets yet."
                buttonText="Link to docs"
                linkButton={BUSTER_DOCS_QUICKSTART}
                buttonPrefix={null}
                buttonSuffix={<ArrowUpRight />}
                linkButtonTarget="_blank"
                description="Datasets help you organize your data and Buster uses them to help answer questions. Datasets will appear here when you create them. Currently, you can only create datasets through our CLI tool which you can read more about in our docs."
                //  onClick={onClickEmptyState}
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

const getStatusText = (d: BusterDatasetListItem) => {
  if (d.enabled) {
    return 'Published';
  }
  return 'Draft';
};
