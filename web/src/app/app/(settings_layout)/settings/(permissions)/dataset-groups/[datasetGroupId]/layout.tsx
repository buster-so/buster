import type React from 'react';
import { DatasetGroupTitleAndDescription } from './DatasetGroupTitleAndDescription';
import { prefetchDatasetGroup } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetGroupBackButton } from './DatasetGroupBackButton';
import { DatasetGroupAppSegments } from './DatasetGroupAppSegments';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ datasetGroupId: string }>;
}) {
  const params = await props.params;

  const { datasetGroupId } = params;

  const { children } = props;

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
