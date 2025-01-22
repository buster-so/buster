import { prefetchGetUserPermissionGroups } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserPermissionGroupsController } from './UserPermissionGroupsController';
import { useCheckIfUserIsAdmin_server } from '../../../../../../server_context/user';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function Page({ params }: { params: { userId: string } }) {
  const isAdmin = await useCheckIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_SETTINGS_USERS
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
