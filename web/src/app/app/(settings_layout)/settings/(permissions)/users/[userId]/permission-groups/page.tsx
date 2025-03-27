import { prefetchGetUserPermissionGroups } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
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
