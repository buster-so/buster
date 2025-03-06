import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Index() {
  const { user } = await getSupabaseServerContext();

  if (!user) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  if (user?.id) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC
      })
    );
  }

  return <>testing123</>;
}
