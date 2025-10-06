import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ensureGetMyUserInfo } from '@/api/buster_rest/users';

export const Route = createFileRoute('/screenshots')({
  ssr: true,
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await ensureGetMyUserInfo(context.queryClient);
  },
});

function RouteComponent() {
  return <Outlet />;
}
