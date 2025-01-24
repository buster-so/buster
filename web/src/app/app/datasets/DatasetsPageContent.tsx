'use client';

import React from 'react';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemo, useState } from 'react';
import { DatasetListContent } from './_DatasetListContent';
import { DatasetHeader } from './_DatasetsHeader';

export const DatasetsPageContent: React.FC<{}> = ({}) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const [datasetFilter, setDatasetFilter] = useState<'all' | 'published' | 'drafts'>('all');

  const datasetsParams: Parameters<typeof useGetDatasets>[0] = useMemo(() => {
    if (datasetFilter === 'drafts') {
      return {
        enabled: false,
        admin_view: isAdmin
      };
    }

    if (datasetFilter === 'published') {
      return {
        enabled: true,
        admin_view: isAdmin
      };
    }

    return {
      admin_view: isAdmin
    };
  }, [datasetFilter]);

  const { isFetched: isFetchedDatasets, data: datasetsList } = useGetDatasets(datasetsParams);

  return (
    <>
      <DatasetHeader datasetFilter={datasetFilter} setDatasetFilter={setDatasetFilter} />
      <DatasetListContent
        datasetsList={datasetsList || []}
        isFetchedDatasets={isFetchedDatasets}
        isAdmin={isAdmin}
      />
    </>
  );
};
