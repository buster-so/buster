'use client';

import React from 'react';
import { useDatasetPageContextSelector } from '../_DatasetsLayout/DatasetPageContext';
import { OverviewHeader } from './OverviewHeader';
import { OverviewData } from './OverviewData';
import { Separator } from '@/components/ui/seperator';

export default function Page() {
  const datasetRes = useDatasetPageContextSelector((state) => state.dataset);
  const datasetDataRes = useDatasetPageContextSelector((state) => state.datasetData);

  const datasetData = datasetDataRes?.data;
  const dataset = datasetRes?.data;
  const isFetchedDataset = datasetRes?.isFetched;
  const isFetchedDatasetData = datasetDataRes?.isFetched;

  const showSkeletonLoader = !dataset?.id || !isFetchedDataset;

  return (
    <div className="mx-auto overflow-y-auto px-14 pt-12 pb-12">
      {showSkeletonLoader ? null : (
        <div className="flex w-full flex-col space-y-5">
          <OverviewHeader
            datasetId={dataset.id}
            description={dataset.description}
            name={dataset.name}
          />

          <Separator />

          <OverviewData
            datasetId={dataset.id}
            data={datasetData || []}
            isFetchedDatasetData={isFetchedDatasetData}
          />
        </div>
      )}
    </div>
  );
}
