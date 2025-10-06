import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ensureGetMyUserInfo } from '@/api/buster_rest/users';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';

export const Route = createFileRoute('/screenshots/_content')({
  ssr: true,
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await getSupabaseSession();
    await ensureGetMyUserInfo(context.queryClient);
    return { user };
  },
});

function RouteComponent() {
  return <Outlet />;
}
