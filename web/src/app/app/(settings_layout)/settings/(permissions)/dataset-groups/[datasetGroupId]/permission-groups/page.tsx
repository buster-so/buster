import { prefetchDatasetGroupPermissionGroups } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetGroupDatasetGroupsController } from './DatasetGroupDatasetGroupsController';

export default async function Page(
  props: {
    params: Promise<{ datasetGroupId: string }>;
  }
) {
  const params = await props.params;

  const {
    datasetGroupId
  } = params;

  const queryClient = await prefetchDatasetGroupPermissionGroups(datasetGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetGroupDatasetGroupsController datasetGroupId={datasetGroupId} />
    </HydrationBoundary>
  );
}
