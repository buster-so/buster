import { prefetchPermissionGroupDatasets } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PermissionGroupDatasetsController } from './_PermissionGroupDatasetsController';

export default async function Page(props: {
  params: Promise<{ permissionGroupId: string }>;
}) {
  const params = await props.params;

  const { permissionGroupId } = params;

  const queryClient = await prefetchPermissionGroupDatasets(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupDatasetsController permissionGroupId={permissionGroupId} />
    </HydrationBoundary>
  );
}
