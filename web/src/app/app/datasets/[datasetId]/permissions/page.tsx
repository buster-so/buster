import React from 'react';
import { PermissionTitleCard } from './PermissionTitleCard';
import { prefetchGetDatasetPermissionsOverview } from '@/api/buster-rest/datasets/permissions/queryRequests';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { PermissionsAppContainer } from './PermissionsAppContainer';

export default async function Page({ params }: { params: { datasetId: string } }) {
  const datasetId = params.datasetId;
  const queryClient = await prefetchGetDatasetPermissionsOverview(datasetId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="m-auto flex h-full max-w-[1400px] flex-col space-y-5 overflow-y-auto px-14 pb-12 pt-12">
        <PermissionTitleCard />
        <PermissionsAppContainer datasetId={datasetId} />
      </div>
    </HydrationBoundary>
  );
}
