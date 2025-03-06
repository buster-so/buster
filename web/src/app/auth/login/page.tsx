import { LoginForm } from '@/components/features/auth/LoginForm';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const supabase = await getSupabaseServerContext();
  const { user } = supabase;

  if (user?.id) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_ROOT
      })
    );
  }

  return <LoginForm user={user} />;
}
