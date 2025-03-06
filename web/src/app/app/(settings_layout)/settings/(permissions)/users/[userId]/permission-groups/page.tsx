import { prefetchGetUserPermissionGroups } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserPermissionGroupsController } from './UserPermissionGroupsController';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { checkIfUserIsAdmin_server } from '@/server_context/user';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const isAdmin = await checkIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_USERS
      })
    );
  }

  const queryClient = await prefetchGetUserPermissionGroups(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserPermissionGroupsController userId={params.userId} />
    </HydrationBoundary>
  );
}
