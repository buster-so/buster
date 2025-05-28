import { prefetchPermissionGroupDatasetGroups } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PermissionGroupDatasetGroupsController } from './_PermissionGroupDatasetGroupsController';

export default async function Page(props: {
  params: Promise<{ permissionGroupId: string }>;
}) {
  const params = await props.params;

  const { permissionGroupId } = params;

  const queryClient = await prefetchPermissionGroupDatasetGroups(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupDatasetGroupsController permissionGroupId={permissionGroupId} />
    </HydrationBoundary>
  );
}
