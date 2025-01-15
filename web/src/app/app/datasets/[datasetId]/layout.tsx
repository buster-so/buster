import React from 'react';
import { DatasetPageLayout } from './DatasetPageLayout';
import { prefetchGetDatasetMetadata } from '@/api/buster-rest/datasets';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function Layout({
  params,
  children
}: {
  params: { datasetId: string };
  children: React.ReactNode;
}) {
  const queryClient = await prefetchGetDatasetMetadata(params.datasetId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetPageLayout datasetId={params.datasetId}>{children}</DatasetPageLayout>
    </HydrationBoundary>
  );
}
