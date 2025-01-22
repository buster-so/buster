import { prefetchDatasetGroupDatasets } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetGroupDatasetsController } from './DatasetGroupDatasetsController';

export default async function Page({
  params: { datasetGroupId }
}: {
  params: { datasetGroupId: string };
}) {
  const queryClient = await prefetchDatasetGroupDatasets(datasetGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetGroupDatasetsController datasetGroupId={datasetGroupId} />
    </HydrationBoundary>
  );
}
