import { prefetchDatasetGroupPermissionGroups } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetGroupDatasetGroupsController } from './DatasetGroupDatasetGroupsController';

export default async function Page({
  params: { datasetGroupId }
}: {
  params: { datasetGroupId: string };
}) {
  const queryClient = await prefetchDatasetGroupPermissionGroups(datasetGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetGroupDatasetGroupsController datasetGroupId={datasetGroupId} />
    </HydrationBoundary>
  );
}
