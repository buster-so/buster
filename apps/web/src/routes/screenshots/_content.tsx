import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ensureGetMyUserInfo } from '@/api/buster_rest/users';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';

export const Route = createFileRoute('/screenshots/_content')({
  ssr: true,
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await ensureGetMyUserInfo(context.queryClient);
  },
});

function RouteComponent() {
  return <Outlet />;
}
