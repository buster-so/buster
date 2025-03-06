import React from 'react';
import { prefetchGetDatasetMetadata } from '@/api/buster_rest/datasets';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetPageProvider } from './_DatasetsLayout/DatasetPageContext';
import { AppPageLayout } from '@/components/ui/layouts';
import { DatasetsIndividualHeader } from './_DatasetsLayout/DatasetsIndividualHeader';

export default async function Layout(
  props: {
    params: Promise<{ datasetId: string }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const queryClient = await prefetchGetDatasetMetadata(params.datasetId);
  const datasetId = params.datasetId;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetPageProvider datasetId={datasetId}>
        <AppPageLayout header={<DatasetsIndividualHeader />}>{children}</AppPageLayout>
      </DatasetPageProvider>
    </HydrationBoundary>
  );
}
