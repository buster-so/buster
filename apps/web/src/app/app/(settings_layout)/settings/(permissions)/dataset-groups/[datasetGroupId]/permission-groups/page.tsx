import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchDatasetGroupPermissionGroups } from '@/api/buster_rest';
import { DatasetGroupPermissionGroupsController } from './DatasetGroupPermissionGroupsController';

export default async function Page(props: { params: Promise<{ datasetGroupId: string }> }) {
  const params = await props.params;

  const { datasetGroupId } = params;

  const queryClient = await prefetchDatasetGroupPermissionGroups(datasetGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetGroupPermissionGroupsController datasetGroupId={datasetGroupId} />
    </HydrationBoundary>
  );
}
