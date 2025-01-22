import { prefetchPermissionGroupDatasets } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PermissionGroupDatasetsController } from './PermissionGroupDatasetsController';

export default async function Page({
  params: { permissionGroupId }
}: {
  params: { permissionGroupId: string };
}) {
  const queryClient = await prefetchPermissionGroupDatasets(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupDatasetsController permissionGroupId={permissionGroupId} />
    </HydrationBoundary>
  );
}
