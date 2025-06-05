import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchGetUserPermissionGroups } from '@/api/buster_rest/users';
import { UserPermissionGroupsController } from './UserPermissionGroupsController';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;

  const queryClient = await prefetchGetUserPermissionGroups(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserPermissionGroupsController userId={params.userId} />
    </HydrationBoundary>
  );
}
