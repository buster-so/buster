import { getSupabaseUserContext } from '@/lib/supabase';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { redirect } from 'next/navigation';

export default async function Index() {
  const { user } = await getSupabaseUserContext();

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
        route: BusterRoutes.APP_HOME
      })
    );
  }

  return <></>;
}
