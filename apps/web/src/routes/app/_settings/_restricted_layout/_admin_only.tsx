import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { checkIfUserIsAdmin } from '@/lib/user';

export const Route = createFileRoute('/app/_settings/_restricted_layout/_admin_only')({
  beforeLoad: async ({ context, matches }) => {
    const lastMatch = matches[matches.length - 1];
    const { queryClient } = context;
    const userData = await prefetchGetMyUserInfo(queryClient);
    if (!userData || !userData.organizations || !checkIfUserIsAdmin(userData.organizations[0])) {
      throw redirect({
        to: '/auth/login',
        search: { next: lastMatch.pathname },
        replace: true,
        statusCode: 307,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
