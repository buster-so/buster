'use client';

import React from 'react';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemo, useState } from 'react';
import { DatasetListContent } from './DatasetListContent';
import { DatasetHeader } from './DatasetsHeader';
import { NewDatasetModal } from '@/components/features/modal/NewDatasetModal';
import { AppPageLayout } from '@/components/ui/layouts';

export const DatasetsListController: React.FC<{}> = ({}) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const [datasetFilter, setDatasetFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [openDatasetModal, setOpenDatasetModal] = useState<boolean>(false);

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
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <DatasetHeader
          datasetFilter={datasetFilter}
          setDatasetFilter={setDatasetFilter}
          openNewDatasetModal={openDatasetModal}
          setOpenNewDatasetModal={setOpenDatasetModal}
        />
      }>
      <DatasetListContent
        datasetsList={datasetsList || []}
        isFetchedDatasets={isFetchedDatasets}
        isAdmin={isAdmin}
        setOpenNewDatasetModal={setOpenDatasetModal}
      />

      <NewDatasetModal open={openDatasetModal} onClose={() => setOpenDatasetModal(false)} />
    </AppPageLayout>
  );
};
