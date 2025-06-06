import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type React from 'react';
import { prefetchDatasetGroup } from '@/api/buster_rest';
import { DatasetGroupAppSegments } from './DatasetGroupAppSegments';
import { DatasetGroupBackButton } from './DatasetGroupBackButton';
import { DatasetGroupTitleAndDescription } from './DatasetGroupTitleAndDescription';

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
