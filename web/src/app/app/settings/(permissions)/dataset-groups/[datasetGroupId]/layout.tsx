import React from 'react';
import { DatasetGroupTitleAndDescription } from './DatasetGroupTitleAndDescription';
import { prefetchDatasetGroup } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetGroupBackButton } from './DatasetGroupBackButton';
import { DatasetGroupAppSegments } from './DatasetGroupAppSegments';

export default async function Layout({
  children,
  params: { datasetGroupId }
}: {
  children: React.ReactNode;
  params: { datasetGroupId: string };
}) {
  const queryClient = await prefetchDatasetGroup(datasetGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
        <DatasetGroupBackButton />
        <DatasetGroupTitleAndDescription datasetGroupId={datasetGroupId} />
        <DatasetGroupAppSegments datasetGroupId={datasetGroupId} />
        {children}
      </div>
    </HydrationBoundary>
  );
}
