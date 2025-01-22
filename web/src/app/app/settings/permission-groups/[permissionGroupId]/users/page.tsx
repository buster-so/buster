import { prefetchPermissionGroupUsers } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PermissionGroupUsersController } from './PermissionGroupUsersController';

export default async function Page({
  params: { permissionGroupId }
}: {
  params: { permissionGroupId: string };
}) {
  const queryClient = await prefetchPermissionGroupUsers(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupUsersController permissionGroupId={permissionGroupId} />
    </HydrationBoundary>
  );
}
