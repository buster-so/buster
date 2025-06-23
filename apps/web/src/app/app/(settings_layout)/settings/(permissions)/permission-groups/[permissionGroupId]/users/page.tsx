import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchPermissionGroupUsers } from '@/api/buster_rest';
import { PermissionGroupUsersController } from './_PermissionGroupUsersController';

export default async function Page(props: { params: Promise<{ permissionGroupId: string }> }) {
  const params = await props.params;

  const { permissionGroupId } = params;

  const queryClient = await prefetchPermissionGroupUsers(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupUsersController permissionGroupId={permissionGroupId} />
    </HydrationBoundary>
  );
}
